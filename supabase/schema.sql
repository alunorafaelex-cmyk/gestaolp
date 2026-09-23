-- =====================================================================
-- GESTÃO LP MARKETING - Supabase Database Schema & Setup Script
-- Execute este script no SQL Editor do seu projeto Supabase
-- =====================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Empresas (companies)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 4. Tabela de Ações Realizadas (actions)
CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    performed_together BOOLEAN NOT NULL DEFAULT FALSE,
    created_by TEXT NOT NULL,    -- Quem registrou no sistema
    description TEXT NOT NULL,
    action_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. Tabela de Histórico de Alterações (action_history)
CREATE TABLE IF NOT EXISTS public.action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES public.actions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
    changed_by TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_actions_company_id ON public.actions(company_id);
CREATE INDEX IF NOT EXISTS idx_actions_action_at ON public.actions(action_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_deleted_at ON public.actions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON public.companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_action_history_action_id ON public.action_history(action_id);
CREATE INDEX IF NOT EXISTS idx_action_history_created_at ON public.action_history(created_at DESC);

-- 7. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de RLS (Permitir acesso total a usuários autenticados)
DROP POLICY IF EXISTS "Authenticated users full access to profiles" ON public.profiles;
CREATE POLICY "Authenticated users full access to profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to companies" ON public.companies;
CREATE POLICY "Authenticated users full access to companies"
    ON public.companies FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to actions" ON public.actions;
CREATE POLICY "Authenticated users full access to actions"
    ON public.actions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to action_history" ON public.action_history;
CREATE POLICY "Authenticated users full access to action_history"
    ON public.action_history FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Função RPC para restauração de versão anterior (restore_action_from_history)
CREATE OR REPLACE FUNCTION public.restore_action_from_history(history_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    hist_record RECORD;
    restored_action RECORD;
    actor_name TEXT;
    prev_state JSONB;
BEGIN
    -- Obter o registro de histórico
    SELECT * INTO hist_record FROM public.action_history WHERE id = history_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro de histórico não encontrado: %', history_id;
    END IF;

    -- Obter os dados anteriores
    IF hist_record.before_data IS NULL THEN
        RAISE EXCEPTION 'Este registro de histórico não possui dados anteriores para restaurar';
    END IF;

    -- Capturar estado atual antes de restaurar
    SELECT * INTO restored_action FROM public.actions WHERE id = hist_record.action_id;
    prev_state := to_jsonb(restored_action);

    -- Determinar autor da restauração
    actor_name := coalesce(
        current_setting('request.jwt.claims', true)::jsonb->>'email',
        'Usuário'
    );

    -- Restaurar campos na tabela actions de maneira segura
    UPDATE public.actions
    SET 
        company_id = (hist_record.before_data->>'company_id')::UUID,
        performed_by = CASE 
            WHEN coalesce((hist_record.before_data->>'performed_together')::BOOLEAN, false) THEN NULL
            WHEN hist_record.before_data->>'performed_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN (hist_record.before_data->>'performed_by')::UUID
            ELSE NULL
        END,
        performed_together = coalesce((hist_record.before_data->>'performed_together')::BOOLEAN, false),
        description = hist_record.before_data->>'description',
        action_at = (hist_record.before_data->>'action_at')::TIMESTAMPTZ,
        deleted_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = hist_record.action_id;

    -- Gravar evento de restauração no histórico
    INSERT INTO public.action_history (
        action_id,
        event_type,
        changed_by,
        before_data,
        after_data
    ) VALUES (
        hist_record.action_id,
        'RESTORE',
        actor_name,
        prev_state,
        hist_record.before_data
    );

    RETURN hist_record.before_data;
END;
$$;

-- 10. Seed inicial de Empresas (Apenas se a tabela estiver vazia)
INSERT INTO public.companies (name, created_by)
SELECT name, 'Sistema'
FROM (VALUES
    ('Metaforja'),
    ('Milla Store'),
    ('Nóbil Boutique'),
    ('Advocacia FGA'),
    ('VS Tecnologia'),
    ('LP Marketing'),
    ('Vidraçaria Loiola')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.companies LIMIT 1);

-- 11. Habilitar Supabase Realtime para sincronização automática entre Rafael e Leonardo
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.actions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.action_history;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

