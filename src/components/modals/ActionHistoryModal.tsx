import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, ArrowRight, UserCheck, Calendar, Users } from 'lucide-react';
import { Action, ActionHistory, Profile } from '../../types/database';
import { api } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface ActionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
  onRestored: () => void;
  userDisplayName: string;
}

export function ActionHistoryModal({
  isOpen,
  onClose,
  action,
  onRestored,
  userDisplayName,
}: ActionHistoryModalProps) {
  const [historyList, setHistoryList] = useState<ActionHistory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [restoringItem, setRestoringItem] = useState<ActionHistory | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.fetchProfiles().then(setProfiles).catch(console.error);
    }
    if (isOpen && action?.id) {
      loadHistory();
    }
  }, [isOpen, action?.id]);

  const loadHistory = async () => {
    if (!action?.id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const records = await api.fetchActionHistory(action.id);
      setHistoryList(records);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar histórico desta ação.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoringItem) return;
    try {
      setIsRestoring(true);
      setErrorMsg(null);
      await api.restoreActionFromHistory(restoringItem, userDisplayName);
      setRestoringItem(null);
      onRestored();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao restaurar a versão anterior.');
    } finally {
      setIsRestoring(false);
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

  if (!isOpen || !action) return null;

  const currentPerformer = action.performed_by || resolvePerformerDisplay(action);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-cyan-400 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Histórico de Alterações</h2>
                <p className="text-xs text-slate-500">
                  {action.company?.name ? `${action.company.name} • ` : ''}
                  Ação #{action.id.substring(0, 8)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current State Banner */}
          <div className="bg-cyan-50/60 px-6 py-3 border-b border-cyan-100/70 flex items-center justify-between text-xs text-cyan-900">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Versão Atual:
            </span>
            <span className="text-slate-600 truncate max-w-md">
              <span className="font-bold text-slate-800">{currentPerformer}:</span> "{action.description}"
            </span>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <svg className="animate-spin h-6 w-6 text-cyan-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Carregando histórico da ação...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Nenhuma alteração registrada além do cadastro inicial.
              </div>
            ) : (
              <div className="space-y-4">
                {historyList.map((item) => {
                  const canRestore = Boolean(item.before_data && item.before_data.description);
                  const isUpdate = item.event_type === 'UPDATE';
                  const isDelete = item.event_type === 'DELETE';
                  const isRestore = item.event_type === 'RESTORE';

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition shadow-xs"
                    >
                      {/* Meta header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                              isUpdate
                                ? 'bg-amber-100 text-amber-800'
                                : isDelete
                                ? 'bg-rose-100 text-rose-800'
                                : isRestore
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isUpdate
                              ? 'Alteração'
                              : isDelete
                              ? 'Exclusão'
                              : isRestore
                              ? 'Restauração'
                              : 'Criação'}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.changed_by} {isUpdate ? 'alterou esta ação' : isDelete ? 'excluiu esta ação' : isRestore ? 'restaurou versão' : 'criou a ação'}
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>

                      {/* Before / After comparison */}
                      {item.before_data && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* ANTES */}
                          <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3">
                            <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block mb-1">
                              ANTES:
                            </span>
                            <div className="space-y-1 text-slate-700">
                              <p className="font-semibold text-slate-900">
                                "{item.before_data.description}"
                              </p>
                              <p className="text-slate-600 flex items-center gap-1 font-medium">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                Realizado por: <strong className="text-slate-900">{resolvePerformerDisplay(item.before_data)}</strong>
                              </p>
                              {item.before_data.action_at && (
                                <p className="text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  Data: {formatDateTime(item.before_data.action_at)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* DEPOIS */}
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
                            <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-1">
                              DEPOIS:
                            </span>
                            <div className="space-y-1 text-slate-700">
                              <p className="font-semibold text-slate-900">
                                "{item.after_data?.description || '—'}"
                              </p>
                              <p className="text-slate-600 flex items-center gap-1 font-medium">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                Realizado por: <strong className="text-slate-900">{resolvePerformerDisplay(item.after_data)}</strong>
                              </p>
                              {item.after_data?.action_at && (
                                <p className="text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  Data: {formatDateTime(item.after_data.action_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Restore action button */}
                      {canRestore && (
                        <div className="mt-3 pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setRestoringItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            RESTAURAR ESTA VERSÃO
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal before restoring version */}
      <ConfirmModal
        isOpen={Boolean(restoringItem)}
        title="Restaurar versão anterior?"
        message={`Você está prestes a retroceder o conteúdo desta ação para a versão anterior a ${
          restoringItem ? formatDateTime(restoringItem.created_at) : ''
        }. Essa alteração também será registrada no histórico.`}
        confirmText="Restaurar Versão"
        cancelText="Voltar"
        variant="primary"
        isLoading={isRestoring}
        onConfirm={handleConfirmRestore}
        onCancel={() => setRestoringItem(null)}
      />
    </>
  );
}
