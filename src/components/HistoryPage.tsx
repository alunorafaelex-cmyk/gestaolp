import React, { useState, useEffect } from 'react';
import {
  History,
  Building2,
  Calendar,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { ActionHistory, Profile, Action } from '../types/database';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';

interface HistoryPageProps {
  onSelectCompanyByName?: (companyName: string) => void;
  refreshTrigger: number;
}

export function HistoryPage({ onSelectCompanyByName, refreshTrigger }: HistoryPageProps) {
  const [historyItems, setHistoryItems] = useState<ActionHistory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.fetchProfiles().then(setProfiles).catch(console.error);
    loadGlobalHistory();
  }, [refreshTrigger]);

  const loadGlobalHistory = async () => {
    try {
      setLoading(true);
      const data = await api.fetchActionHistory();
      setHistoryItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'CREATE':
        return {
          label: 'Criação',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'UPDATE':
        return {
          label: 'Edição',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'DELETE':
        return {
          label: 'Exclusão',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'RESTORE':
        return {
          label: 'Restauração',
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        };
      default:
        return {
          label: type,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const getActionHeadline = (item: ActionHistory) => {
    const actor = item.changed_by || 'Colaborador';
    switch (item.event_type) {
      case 'CREATE':
        return `${actor} registrou uma nova ação`;
      case 'UPDATE':
        return `${actor} editou uma ação`;
      case 'DELETE':
        return `${actor} excluiu uma ação`;
      case 'RESTORE':
        return `${actor} restaurou uma ação`;
      default:
        return `${actor} realizou uma alteração`;
    }
  };

  // Helper to resolve human-friendly collaborator name for history states
  const resolvePerformerDisplay = (data: Partial<Action> | null | undefined): string => {
    if (!data) return '—';
    if (data.performed_by) {
      if (['Rafael', 'Leonardo', 'Rafael e Leonardo'].includes(data.performed_by)) {
        return data.performed_by;
      }
      const p = profiles.find((prof) => prof.id === data.performed_by);
      if (p) return p.display_name;
      return data.performed_by;
    }
    return 'Colaborador';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">
          <History className="w-4 h-4 text-cyan-500" />
          Auditoria & Rastreabilidade
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Histórico Geral do Sistema
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Registro completo de todas as criações, edições, exclusões e restaurações realizadas na agência.
        </p>
      </div>

      {/* History timeline list */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <svg className="animate-spin h-6 w-6 text-cyan-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-500">Carregando histórico do sistema...</p>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              Nenhuma alteração registrada até o momento.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Conforme Rafael e Leonardo criarem, editarem ou excluírem registros, o histórico aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => {
              const badge = getEventBadge(item.event_type);
              const isExpanded = expandedId === item.id;
              const hasDiff = Boolean(item.before_data || item.after_data);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.color}`}
                        >
                          {badge.label}
                        </span>

                        <span className="font-bold text-slate-900 text-sm">
                          {getActionHeadline(item)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {item.company_name && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {item.company_name}
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>

                      {/* Snippet text */}
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {item.after_data?.description || item.before_data?.description || 'Detalhes da ação'}
                      </p>
                    </div>

                    {/* Diff expand toggle */}
                    {hasDiff && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition shrink-0 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expanded Diff Area */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
                      {/* Antes */}
                      <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                        <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block mb-1">
                          ESTADO ANTERIOR:
                        </span>
                        {item.before_data ? (
                          <div className="space-y-1 text-slate-700">
                            <p className="font-medium text-slate-900">
                              "{item.before_data.description || '—'}"
                            </p>
                            <p className="text-slate-600 flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              Realizado por: <strong className="text-slate-900">{resolvePerformerDisplay(item.before_data)}</strong>
                            </p>
                            {item.before_data.action_at && (
                              <p className="text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Data: {formatDateTime(item.before_data.action_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Nenhum dado anterior (Ação Nova)</p>
                        )}
                      </div>

                      {/* Depois */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                        <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-1">
                          NOVO ESTADO:
                        </span>
                        {item.after_data ? (
                          <div className="space-y-1 text-slate-700">
                            <p className="font-medium text-slate-900">
                              "{item.after_data.description || '—'}"
                            </p>
                            <p className="text-slate-600 flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              Realizado por: <strong className="text-slate-900">{resolvePerformerDisplay(item.after_data)}</strong>
                            </p>
                            {item.after_data.action_at && (
                              <p className="text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Data: {formatDateTime(item.after_data.action_at)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic">Nenhum dado posterior (Registro Excluído)</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
