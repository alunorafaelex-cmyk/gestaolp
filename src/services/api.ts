import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Company,
  Action,
  ActionHistory,
  DashboardStats,
  Profile,
  ActionSavePayload,
} from '../types/database';

export const VALID_PERFORMERS = ['Rafael', 'Leonardo', 'Rafael e Leonardo'] as const;
export type ValidPerformer = (typeof VALID_PERFORMERS)[number];

// In-memory profiles cache for user auth context
let cachedProfiles: Profile[] = [];
let lastProfilesFetch = 0;

export const api = {
  // ----------------------------------------------------
  // PROFILES (COLABORADORES)
  // ----------------------------------------------------
  getCachedProfiles(): Profile[] {
    return cachedProfiles;
  },

  async fetchProfiles(forceRefresh = false): Promise<Profile[]> {
    if (!isSupabaseConfigured) return [];

    const now = Date.now();
    if (!forceRefresh && cachedProfiles.length > 0 && now - lastProfilesFetch < 60000) {
      return cachedProfiles;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching profiles:', error);
        return cachedProfiles;
      }

      cachedProfiles = (data as Profile[]) || [];
      lastProfilesFetch = now;
      return cachedProfiles;
    } catch (err) {
      console.error('Exception fetching profiles:', err);
      return cachedProfiles;
    }
  },

  // Helper to resolve performer display object for an action
  attachPerformerInfo(action: any): Action {
    const performedBy = action.performed_by || 'Colaborador';
    return {
      ...action,
      performed_by: performedBy,
      performer: {
        id: performedBy,
        display_name: performedBy,
      },
    } as Action;
  },

  // ----------------------------------------------------
  // COMPANIES
  // ----------------------------------------------------
  async fetchCompanies(includeDeleted = false): Promise<Company[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (includeDeleted) {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching companies:', error);
      throw new Error(error.message || 'Erro ao carregar empresas.');
    }

    return (data as Company[]) || [];
  },

  async createCompany(name: string, userDisplayName: string): Promise<Company> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const cleanName = name.trim();
    if (!cleanName) throw new Error('O nome da empresa não pode ser vazio.');

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: cleanName,
        created_by: userDisplayName || 'Usuário',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      throw new Error(error.message || 'Erro ao criar empresa.');
    }

    return data as Company;
  },

  async updateCompanyName(id: string, name: string): Promise<Company> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const cleanName = name.trim();
    if (!cleanName) throw new Error('O nome da empresa não pode ser vazio.');

    const { data, error } = await supabase
      .from('companies')
      .update({
        name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      throw new Error(error.message || 'Erro ao atualizar empresa.');
    }

    return data as Company;
  },

  async softDeleteCompany(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const { error } = await supabase
      .from('companies')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft-deleting company:', error);
      throw new Error(error.message || 'Erro ao excluir empresa.');
    }
  },

  async restoreCompany(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const { error } = await supabase
      .from('companies')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring company:', error);
      throw new Error(error.message || 'Erro ao restaurar empresa.');
    }
  },

  // ----------------------------------------------------
  // ACTIONS
  // ----------------------------------------------------
  async fetchActions(options: {
    companyId?: string;
    performerFilter?: string; // 'todos' | 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
    startDate?: string;
    endDate?: string;
    search?: string;
    includeDeleted?: boolean;
    limit?: number;
  } = {}): Promise<Action[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('actions')
      .select('*, company:companies(id, name)')
      .order('action_at', { ascending: false });

    if (options.includeDeleted) {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
    }

    if (options.companyId) {
      query = query.eq('company_id', options.companyId);
    }

    // Filter by collaborator logic:
    // TODOS: mostrar tudo
    // RAFAEL: performed_by = 'Rafael' OU performed_by = 'Rafael e Leonardo'
    // LEONARDO: performed_by = 'Leonardo' OU performed_by = 'Rafael e Leonardo'
    // RAFAEL E LEONARDO: performed_by = 'Rafael e Leonardo'
    if (options.performerFilter && options.performerFilter !== 'todos') {
      if (options.performerFilter === 'Rafael') {
        query = query.in('performed_by', ['Rafael', 'Rafael e Leonardo']);
      } else if (options.performerFilter === 'Leonardo') {
        query = query.in('performed_by', ['Leonardo', 'Rafael e Leonardo']);
      } else if (options.performerFilter === 'Rafael e Leonardo') {
        query = query.eq('performed_by', 'Rafael e Leonardo');
      }
    }

    if (options.startDate) {
      const startIso = new Date(options.startDate + 'T00:00:00').toISOString();
      query = query.gte('action_at', startIso);
    }

    if (options.endDate) {
      const endIso = new Date(options.endDate + 'T23:59:59.999').toISOString();
      query = query.lte('action_at', endIso);
    }

    if (options.search && options.search.trim()) {
      query = query.ilike('description', `%${options.search.trim()}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching actions:', error);
      throw new Error(error.message || 'Erro ao carregar ações.');
    }

    return (data || []).map((raw) => this.attachPerformerInfo(raw));
  },

  async createAction(input: {
    companyId: string;
    performedBy: string; // 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
    description: string;
    actionAt: string;
    userDisplayName?: string;
  }): Promise<Action> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const validPerformers = ['Rafael', 'Leonardo', 'Rafael e Leonardo'];
    const performedBy = validPerformers.includes(input.performedBy)
      ? input.performedBy
      : 'Rafael';

    // Obter o usuário autenticado do Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const authUserId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id;
    if (!authUserId) {
      throw new Error('Usuário autenticado não encontrado. Faça login novamente.');
    }

    const actionDateIso = input.actionAt
      ? new Date(input.actionAt).toISOString()
      : new Date().toISOString();

    const payload = {
      company_id: input.companyId,
      performed_by: performedBy,
      created_by: authUserId,
      description: input.description.trim(),
      action_at: actionDateIso,
    };

    console.log(JSON.stringify(payload, null, 2));

    // 1. Insert action into Supabase
    const { data: newAction, error: insertError } = await supabase
      .from('actions')
      .insert(payload)
      .select('*, company:companies(id, name)')
      .single();

    if (insertError) {
      console.error('Error inserting action:', insertError);
      throw new Error(insertError.message || 'Erro ao registrar ação.');
    }

    // 2. Log in action_history
    try {
      await supabase.from('action_history').insert({
        action_id: newAction.id,
        event_type: 'CREATE',
        changed_by: input.userDisplayName || user?.email || 'Usuário',
        before_data: null,
        after_data: {
          company_id: newAction.company_id,
          performed_by: newAction.performed_by,
          created_by: newAction.created_by,
          description: newAction.description,
          action_at: newAction.action_at,
        },
        created_at: new Date().toISOString(),
      });
    } catch (histError) {
      console.warn('Could not record history log:', histError);
    }

    return this.attachPerformerInfo(newAction);
  },

  async updateAction(
    id: string,
    updates: {
      companyId: string;
      performedBy: string; // 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
      description: string;
      actionAt: string;
    },
    previousAction: Action,
    userDisplayName: string
  ): Promise<Action> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const validPerformers = ['Rafael', 'Leonardo', 'Rafael e Leonardo'];
    const performedBy = validPerformers.includes(updates.performedBy)
      ? updates.performedBy
      : previousAction.performed_by || 'Rafael';

    const nowIso = new Date().toISOString();
    const actionDateIso = updates.actionAt ? new Date(updates.actionAt).toISOString() : nowIso;

    const beforeState = {
      company_id: previousAction.company_id,
      performed_by: previousAction.performed_by,
      description: previousAction.description,
      action_at: previousAction.action_at,
    };

    const payload = {
      company_id: updates.companyId,
      performed_by: performedBy,
      description: updates.description.trim(),
      action_at: actionDateIso,
      updated_at: nowIso,
    };

    console.log(JSON.stringify(payload, null, 2));

    // 1. Log previous state in action_history before change
    try {
      await supabase.from('action_history').insert({
        action_id: id,
        event_type: 'UPDATE',
        changed_by: userDisplayName || 'Usuário',
        before_data: beforeState,
        after_data: payload,
        created_at: nowIso,
      });
    } catch (histError) {
      console.warn('Failed recording update history:', histError);
    }

    // 2. Update action in database
    const { data: updatedAction, error: updateError } = await supabase
      .from('actions')
      .update(payload)
      .eq('id', id)
      .select('*, company:companies(id, name)')
      .single();

    if (updateError) {
      console.error('Error updating action:', updateError);
      throw new Error(updateError.message || 'Erro ao salvar alterações da ação.');
    }

    return this.attachPerformerInfo(updatedAction);
  },

  async softDeleteAction(id: string, currentAction: Action, userDisplayName: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const nowIso = new Date().toISOString();

    // 1. Log delete event in action_history
    try {
      await supabase.from('action_history').insert({
        action_id: id,
        event_type: 'DELETE',
        changed_by: userDisplayName || 'Usuário',
        before_data: {
          company_id: currentAction.company_id,
          performed_by: currentAction.performed_by,
          description: currentAction.description,
          action_at: currentAction.action_at,
        },
        after_data: null,
        created_at: nowIso,
      });
    } catch (histErr) {
      console.warn('Could not record delete in history:', histErr);
    }

    // 2. Soft delete
    const { error } = await supabase
      .from('actions')
      .update({
        deleted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', id);

    if (error) {
      console.error('Error soft-deleting action:', error);
      throw new Error(error.message || 'Erro ao excluir ação.');
    }
  },

  async restoreAction(id: string, currentAction: Action, userDisplayName: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    const nowIso = new Date().toISOString();

    // 1. Restore action
    const { error } = await supabase
      .from('actions')
      .update({
        deleted_at: null,
        updated_at: nowIso,
      })
      .eq('id', id);

    if (error) {
      console.error('Error restoring action:', error);
      throw new Error(error.message || 'Erro ao restaurar ação da lixeira.');
    }

    // 2. Log in action_history
    try {
      await supabase.from('action_history').insert({
        action_id: id,
        event_type: 'RESTORE',
        changed_by: userDisplayName || 'Usuário',
        before_data: {
          company_id: currentAction.company_id,
          performed_by: currentAction.performed_by,
          description: currentAction.description,
          action_at: currentAction.action_at,
          deleted_at: currentAction.deleted_at,
        },
        after_data: {
          company_id: currentAction.company_id,
          performed_by: currentAction.performed_by,
          description: currentAction.description,
          action_at: currentAction.action_at,
          deleted_at: null,
        },
        created_at: nowIso,
      });
    } catch (histErr) {
      console.warn('Could not record restore in history:', histErr);
    }
  },

  // ----------------------------------------------------
  // ACTION HISTORY & RESTORE PREVIOUS VERSION
  // ----------------------------------------------------
  async fetchActionHistory(actionId?: string): Promise<ActionHistory[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('action_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (actionId) {
      query = query.eq('action_id', actionId);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching action history:', error);
      return [];
    }

    const histories = (data as ActionHistory[]) || [];

    // Populate company names for general history view
    try {
      const companies = await this.fetchCompanies(true);
      const companyMap = new Map<string, string>();
      companies.forEach((c) => companyMap.set(c.id, c.name));

      histories.forEach((h) => {
        const cId = h.after_data?.company_id || h.before_data?.company_id;
        if (cId && companyMap.has(cId)) {
          h.company_name = companyMap.get(cId);
        }
      });
    } catch (err) {
      console.warn('Could not populate company names for history:', err);
    }

    return histories;
  },

  async restoreActionVersion(
    historyId: string,
    actionId: string,
    userDisplayName: string
  ): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase não configurado');

    // 1. Get history row
    const { data: historyRow, error: fetchErr } = await supabase
      .from('action_history')
      .select('*')
      .eq('id', historyId)
      .single();

    if (fetchErr || !historyRow) {
      throw new Error('Registro de histórico não encontrado.');
    }

    const beforeData = historyRow.before_data;
    if (!beforeData) {
      throw new Error('Esta versão não contém dados anteriores para restauração.');
    }

    // 2. Determine performed_by
    let targetPerformedBy = 'Rafael';
    if (beforeData.performed_by) {
      targetPerformedBy = beforeData.performed_by;
    }

    const nowIso = new Date().toISOString();

    // 3. Get current action state for logging
    const { data: currentAction } = await supabase
      .from('actions')
      .select('*')
      .eq('id', actionId)
      .single();

    // 4. Update action with restored values
    const { error: updateErr } = await supabase
      .from('actions')
      .update({
        company_id: beforeData.company_id,
        performed_by: targetPerformedBy,
        description: beforeData.description,
        action_at: beforeData.action_at || nowIso,
        deleted_at: null,
        updated_at: nowIso,
      })
      .eq('id', actionId);

    if (updateErr) {
      console.error('Error applying restored version:', updateErr);
      throw new Error(updateErr.message || 'Erro ao restaurar versão.');
    }

    // 5. Record RESTORE in action_history
    try {
      await supabase.from('action_history').insert({
        action_id: actionId,
        event_type: 'RESTORE',
        changed_by: userDisplayName || 'Usuário',
        before_data: currentAction ? {
          company_id: currentAction.company_id,
          performed_by: currentAction.performed_by,
          description: currentAction.description,
          action_at: currentAction.action_at,
        } : null,
        after_data: {
          company_id: beforeData.company_id,
          performed_by: targetPerformedBy,
          description: beforeData.description,
          action_at: beforeData.action_at,
        },
        created_at: nowIso,
      });
    } catch (histErr) {
      console.warn('Could not record restore in history:', histErr);
    }
  },

  async restoreActionFromHistory(item: ActionHistory, userDisplayName: string): Promise<void> {
    return this.restoreActionVersion(item.id, item.action_id, userDisplayName);
  },

  // ----------------------------------------------------
  // DASHBOARD AGGREGATES & STATS
  // ----------------------------------------------------
  async fetchDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
      return {
        todayCount: 0,
        last7DaysCount: 0,
        thisMonthCount: 0,
        todayRafael: 0,
        todayLeonardo: 0,
        todayTogether: 0,
      };
    }

    const now = new Date();
    // Today (start of day local)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    // Last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // This month (start of current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();

    const [todayActionsRes, sevenDaysRes, monthRes] = await Promise.all([
      supabase
        .from('actions')
        .select('performed_by')
        .is('deleted_at', null)
        .gte('action_at', todayStart),
      supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('action_at', sevenDaysAgo),
      supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('action_at', monthStart),
    ]);

    let todayRafael = 0;
    let todayLeonardo = 0;
    let todayTogether = 0;
    const todayActions = todayActionsRes.data || [];

    todayActions.forEach((act: any) => {
      const perf = act.performed_by;
      if (perf === 'Rafael') {
        todayRafael += 1;
      } else if (perf === 'Leonardo') {
        todayLeonardo += 1;
      } else if (perf === 'Rafael e Leonardo') {
        todayTogether += 1;
        todayRafael += 1;
        todayLeonardo += 1;
      }
    });

    return {
      todayCount: todayActions.length,
      last7DaysCount: sevenDaysRes.count || 0,
      thisMonthCount: monthRes.count || 0,
      todayRafael,
      todayLeonardo,
      todayTogether,
    };
  },

  async fetchCompaniesWithStats(): Promise<Company[]> {
    const companies = await this.fetchCompanies(false);
    if (!isSupabaseConfigured || companies.length === 0) return companies;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();

    const [actionsMonthRes, latestActions] = await Promise.all([
      supabase
        .from('actions')
        .select('company_id')
        .is('deleted_at', null)
        .gte('action_at', monthStart),
      supabase
        .from('actions')
        .select('*')
        .is('deleted_at', null)
        .order('action_at', { ascending: false }),
    ]);

    // Count actions per company this month
    const countMap = new Map<string, number>();
    (actionsMonthRes.data || []).forEach((row: any) => {
      countMap.set(row.company_id, (countMap.get(row.company_id) || 0) + 1);
    });

    // Find latest action per company
    const lastActionMap = new Map<string, Action>();
    (latestActions.data || []).forEach((raw: any) => {
      if (!lastActionMap.has(raw.company_id)) {
        lastActionMap.set(raw.company_id, this.attachPerformerInfo(raw));
      }
    });

    return companies.map((c) => ({
      ...c,
      action_count_month: countMap.get(c.id) || 0,
      last_action: lastActionMap.get(c.id) || null,
    }));
  },

  // ----------------------------------------------------
  // INITIAL SEED OF COMPANIES
  // ----------------------------------------------------
  async seedInitialCompaniesIfEmpty(userDisplayName: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (count === 0) {
        const initialNames = [
          'Metaforja',
          'Milla Store',
          'Nóbil Boutique',
          'Advocacia FGA',
          'VS Tecnologia',
          'LP Marketing',
          'Vidraçaria Loiola',
        ];

        const rows = initialNames.map((name) => ({
          name,
          created_by: userDisplayName || 'Sistema',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        }));

        await supabase.from('companies').insert(rows);
      }
    } catch (err) {
      console.warn('Seed companies check completed (already populated or no write permission):', err);
    }
  },
};
