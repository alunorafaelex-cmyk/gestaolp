import React, { useState } from 'react';
import { X, Copy, Check, Database, Key } from 'lucide-react';
import { saveCustomSupabaseCredentials, getSupabaseCredentials, isSupabaseConfigured } from '../../lib/supabase';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCRIPT = `-- =====================================================================
-- GESTÃO LP MARKETING - Supabase Database Schema & Setup Script
-- Execute este script no SQL Editor do seu projeto Supabase
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 3. Tabela de Ações Realizadas
CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    performed_by TEXT NOT NULL,
    created_by TEXT NOT NULL,
    description TEXT NOT NULL,
    action_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 4. Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS public.action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id UUID REFERENCES public.actions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_actions_company_id ON public.actions(company_id);
CREATE INDEX IF NOT EXISTS idx_actions_action_at ON public.actions(action_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_deleted_at ON public.actions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON public.companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_action_history_action_id ON public.action_history(action_id);

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS
DROP POLICY IF EXISTS "Authenticated users full access to profiles" ON public.profiles;
CREATE POLICY "Authenticated users full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to companies" ON public.companies;
CREATE POLICY "Authenticated users full access to companies" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to actions" ON public.actions;
CREATE POLICY "Authenticated users full access to actions" ON public.actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to action_history" ON public.action_history;
CREATE POLICY "Authenticated users full access to action_history" ON public.action_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Função RPC para restauração de histórico
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
    SELECT * INTO hist_record FROM public.action_history WHERE id = history_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro não encontrado';
    END IF;

    SELECT * INTO restored_action FROM public.actions WHERE id = hist_record.action_id;
    prev_state := to_jsonb(restored_action);

    actor_name := coalesce(
        current_setting('request.jwt.claims', true)::jsonb->>'email',
        'Usuário'
    );

    UPDATE public.actions
    SET 
        company_id = (hist_record.before_data->>'company_id')::UUID,
        performed_by = coalesce(hist_record.before_data->>'performed_by', 'Rafael'),
        description = hist_record.before_data->>'description',
        action_at = (hist_record.before_data->>'action_at')::TIMESTAMPTZ,
        deleted_at = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = hist_record.action_id;

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

-- 9. Empresas Iniciais
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

-- 10. Habilitar Supabase Realtime (Sincronização em tempo real entre Rafael e Leonardo)
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
`;

export function SqlSchemaModal({ isOpen, onClose }: SqlSchemaModalProps) {
  const [copied, setCopied] = useState(false);
  const creds = getSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(creds.url);
  const [keyInput, setKeyInput] = useState(creds.anonKey);
  const [activeTab, setActiveTab] = useState<'sql' | 'credentials'>('sql');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) return;
    saveCustomSupabaseCredentials(urlInput, keyInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-cyan-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Instalação & Script Supabase</h2>
              <p className="text-xs text-slate-400">Tabelas, RLS e dados iniciais da LP Marketing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sql'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Script SQL Supabase
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'credentials'
                ? 'border-cyan-600 text-cyan-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            Credenciais do Projeto {isSupabaseConfigured ? '✓' : '⚠️'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'sql' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Copie e cole este script diretamente no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas (<code className="text-cyan-700 font-mono">companies</code>, <code className="text-cyan-700 font-mono">actions</code>, <code className="text-cyan-700 font-mono">action_history</code>, <code className="text-cyan-700 font-mono">profiles</code>) e a função RPC.
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-100 hover:bg-cyan-200 rounded-lg transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono rounded-lg overflow-x-auto max-h-80 border border-slate-800 leading-relaxed select-all">
                  {SQL_SCRIPT}
                </pre>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                As variáveis de ambiente padrão são <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
                Se estiver testando nesta pré-visualização antes do deploy na Vercel, você também pode inserir suas credenciais aqui:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Publishable Key (VITE_SUPABASE_PUBLISHABLE_KEY)
                </label>
                <input
                  type="text"
                  placeholder="sb_publishable_..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                >
                  Salvar e Conectar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
