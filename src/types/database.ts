export interface Profile {
  id: string; // UUID
  display_name: string;
  email: string | null;
  created_at?: string;
}

export interface Company {
  id: string;
  name: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Computed / aggregated fields for dashboard
  action_count_month?: number;
  last_action?: Action | null;
}

export type PerformerName = 'Rafael' | 'Leonardo' | 'Rafael e Leonardo';

export interface Action {
  id: string;
  company_id: string;
  performed_by: string; // TEXT: 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
  created_by: string; // UUID do usuário autenticado do Supabase
  description: string;
  action_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined relation
  company?: {
    id: string;
    name: string;
  } | null;
  // Resolved Performer Display Info (opcional para compatibilidade)
  performer?: {
    id: string;
    display_name: string;
  } | null;
}

export type HistoryEventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

export interface ActionHistory {
  id: string;
  action_id: string;
  event_type: HistoryEventType;
  changed_by: string;
  before_data: Partial<Action> | null;
  after_data: Partial<Action> | null;
  created_at: string;
  // Joined or populated for convenient display
  company_name?: string;
}

export interface ActionSavePayload {
  companyId: string;
  performedBy: string; // 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
  description: string;
  actionAt: string;
}

export interface DashboardStats {
  todayCount: number;
  last7DaysCount: number;
  thisMonthCount: number;
  todayRafael: number;
  todayLeonardo: number;
  todayTogether: number;
}
