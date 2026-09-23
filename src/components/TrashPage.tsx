import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  Building2,
  FileText,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';
import { Action, Company } from '../types/database';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { ConfirmModal } from './modals/ConfirmModal';

interface TrashPageProps {
  onRestored: () => void;
  userDisplayName: string;
  refreshTrigger: number;
}

export function TrashPage({ onRestored, userDisplayName, refreshTrigger }: TrashPageProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'companies'>('actions');
  const [deletedActions, setDeletedActions] = useState<Action[]>([]);
  const [deletedCompanies, setDeletedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Restore confirmations
  const [actionToRestore, setActionToRestore] = useState<Action | null>(null);
  const [companyToRestore, setCompanyToRestore] = useState<Company | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadTrashData();
  }, [refreshTrigger]);

  const loadTrashData = async () => {
    try {
      setLoading(true);
      const [actions, companies] = await Promise.all([
        api.fetchActions({ includeDeleted: true }),
        api.fetchCompanies(true),
      ]);
      setDeletedActions(actions);
      setDeletedCompanies(companies);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRestoreAction = async () => {
    if (!actionToRestore) return;
    try {
      setIsRestoring(true);
      await api.restoreAction(actionToRestore.id, actionToRestore, userDisplayName);
      setActionToRestore(null);
      loadTrashData();
      onRestored();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmRestoreCompany = async () => {
    if (!companyToRestore) return;
    try {
      setIsRestoring(true);
      await api.restoreCompany(companyToRestore.id);
      setCompanyToRestore(null);
      loadTrashData();
      onRestored();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
          <Trash2 className="w-4 h-4 text-rose-500" />
          Registros Removidos
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lixeira
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Itens excluídos permanecem salvos com segurança no banco de dados e podem ser restaurados a qualquer momento.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'actions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Ações Excluídas ({deletedActions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('companies')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'companies'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresas Excluídas ({deletedCompanies.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
          <svg className="animate-spin h-6 w-6 text-cyan-600 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-xs text-slate-500">Consultando itens da lixeira...</p>
        </div>
      ) : activeTab === 'actions' ? (
        deletedActions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              A lixeira de ações está vazia.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Nenhuma ação realizada foi excluída no sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deletedActions.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {act.performed_by || 'Colaborador'}
                    </span>
                    {act.performed_by === 'Rafael e Leonardo' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                        Ação Conjunta
                      </span>
                    )}
                    {act.company && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {act.company.name}
                      </span>
                    )}
                    <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-medium">
                      Excluído em {act.deleted_at ? formatDateTime(act.deleted_at) : 'Data não informada'}
                    </span>
                  </div>

                  <p className="text-slate-800 text-sm leading-relaxed">
                    {act.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Realizado em: {formatDateTime(act.action_at)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActionToRestore(act)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  RESTAURAR
                </button>
              </div>
            ))}
          </div>
        )
      ) : deletedCompanies.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            A lixeira de empresas está vazia.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nenhuma empresa foi excluída.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deletedCompanies.map((comp) => (
            <div
              key={comp.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-bold text-slate-900 text-base">{comp.name}</h4>
                <p className="text-xs text-rose-600 mt-1">
                  Excluída em: {comp.deleted_at ? formatDateTime(comp.deleted_at) : '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCompanyToRestore(comp)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESTAURAR
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(actionToRestore)}
        title="Restaurar ação excluída?"
        message={`Deseja restaurar a ação "${actionToRestore?.description}" para as listas ativas?`}
        confirmText="Restaurar Ação"
        cancelText="Cancelar"
        variant="primary"
        isLoading={isRestoring}
        onConfirm={handleConfirmRestoreAction}
        onCancel={() => setActionToRestore(null)}
      />

      <ConfirmModal
        isOpen={Boolean(companyToRestore)}
        title="Restaurar empresa excluída?"
        message={`Deseja reativar a empresa "${companyToRestore?.name}" e torná-la disponível para novos registros?`}
        confirmText="Restaurar Empresa"
        cancelText="Cancelar"
        variant="primary"
        isLoading={isRestoring}
        onConfirm={handleConfirmRestoreCompany}
        onCancel={() => setCompanyToRestore(null)}
      />
    </div>
  );
}
