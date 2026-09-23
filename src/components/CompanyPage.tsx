import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  PlusCircle,
  ArrowLeft,
  Edit2,
  Trash2,
  Layers,
  Calendar,
  Clock,
  History,
  MoreVertical,
} from 'lucide-react';
import { Company, Action } from '../types/database';
import { api } from '../services/api';
import { ActionItem } from './ActionItem';
import {
  toDateInputFormat,
  formatTimeOnly,
  formatDateBrazilian,
  isSameDay,
  computePerformerStats,
} from '../utils/formatters';

interface CompanyPageProps {
  company: Company;
  onBack: () => void;
  onOpenNewActionForCompany: (companyId: string) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;
  onEditAction: (action: Action) => void;
  onViewActionHistory: (action: Action) => void;
  onDeleteAction: (action: Action) => void;
  refreshTrigger: number;
}

export function CompanyPage({
  company,
  onBack,
  onOpenNewActionForCompany,
  onEditCompany,
  onDeleteCompany,
  onEditAction,
  onViewActionHistory,
  onDeleteAction,
  refreshTrigger,
}: CompanyPageProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Seletor de data (padrão: hoje)
  const todayStr = useMemo(() => toDateInputFormat(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    loadCompanyActions();
  }, [company.id, refreshTrigger]);

  const loadCompanyActions = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await api.fetchActions({
        companyId: company.id,
        includeDeleted: false,
      });
      setActions(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar ações desta empresa.');
    } finally {
      setLoading(false);
    }
  };

  const isToday = selectedDate === todayStr;

  // Ações do dia selecionado (ordenadas da mais recente para a mais antiga)
  const dayActions = useMemo(() => {
    return actions
      .filter((act) => isSameDay(act.action_at, selectedDate))
      .sort((a, b) => new Date(b.action_at).getTime() - new Date(a.action_at).getTime());
  }, [actions, selectedDate]);

  // Ações anteriores / fora do dia selecionado
  const olderActions = useMemo(() => {
    return actions
      .filter((act) => !isSameDay(act.action_at, selectedDate))
      .sort((a, b) => new Date(b.action_at).getTime() - new Date(a.action_at).getTime());
  }, [actions, selectedDate]);

  // Estatísticas do dia selecionado para esta empresa
  const dayStats = useMemo(() => {
    return computePerformerStats(dayActions);
  }, [dayActions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Company Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider">
            Empresa
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {company.name}
              </h2>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditCompany(company)}
                  title="Renomear empresa"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCompany(company)}
                  title="Excluir empresa"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Total histórico: {actions.length} {actions.length === 1 ? 'ação registrada' : 'ações registradas'} para este cliente
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewActionForCompany(company.id)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            + REGISTRAR AÇÃO
          </button>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {/* Painel de Estatísticas do Dia da Empresa com Seletor de Data */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              Estatísticas do Dia • {company.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Participações e ações executadas para este cliente na data selecionada
            </p>
          </div>

          {/* Seletor de Data */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Voltar para Hoje
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg">
              <span className="text-xs font-medium text-slate-500">Data:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Grade de Estatísticas da Empresa */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Ações hoje / no dia */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/70 to-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isToday ? 'Ações hoje' : 'Ações no dia'}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {dayStats.total}
              </span>
              <span className="text-xs text-slate-500">
                {dayStats.total === 1 ? 'ação' : 'ações'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Registros totais</p>
          </div>

          {/* Rafael */}
          <div className="p-4 rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/40 to-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-900 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Rafael
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {dayStats.rafael}
              </span>
              <span className="text-xs text-slate-500">
                {dayStats.rafael === 1 ? 'participação' : 'participações'}
              </span>
            </div>
            <p className="text-[10px] text-cyan-700/80 mt-1">Individual ou conjunto</p>
          </div>

          {/* Leonardo */}
          <div className="p-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/40 to-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-violet-900 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Leonardo
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {dayStats.leonardo}
              </span>
              <span className="text-xs text-slate-500">
                {dayStats.leonardo === 1 ? 'participação' : 'participações'}
              </span>
            </div>
            <p className="text-[10px] text-violet-700/80 mt-1">Individual ou conjunto</p>
          </div>

          {/* Em conjunto */}
          <div className="p-4 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/40 to-white">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Em conjunto
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {dayStats.together}
              </span>
              <span className="text-xs text-slate-500">
                {dayStats.together === 1 ? 'ação' : 'ações'}
              </span>
            </div>
            <p className="text-[10px] text-purple-700/80 mt-1">Rafael e Leonardo</p>
          </div>
        </div>
      </div>

      {/* ABAIXO DAS ESTATÍSTICAS: Ações do Dia Selecionado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isToday ? 'Ações de Hoje' : `Ações de ${formatDateBrazilian(selectedDate)}`} ({dayActions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Da mais recente para a mais antiga
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-2">
            <svg className="animate-spin h-5 w-5 text-cyan-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-500">Carregando ações...</p>
          </div>
        ) : dayActions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Nenhuma ação realizada para {company.name} em {formatDateBrazilian(selectedDate)}.
            </p>
            <p className="text-xs text-slate-400">
              {isToday
                ? 'Clique em "+ REGISTRAR AÇÃO" para adicionar um trabalho de hoje.'
                : 'Selecione outra data ou registre uma ação para este dia.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayActions.map((act) => {
              const timeFormatted = formatTimeOnly(act.action_at);
              const performerName = act.performed_by || 'Colaborador';
              const isTogether = performerName === 'Rafael e Leonardo';

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Linha formatada destacada conforme solicitado: HH:mm — Performer — Descrição */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {timeFormatted}
                      </span>
                      <span className="text-slate-400 font-bold">—</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isTogether
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : performerName === 'Rafael'
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                            : 'bg-violet-50 text-violet-800 border border-violet-200'
                        }`}
                      >
                        {performerName}
                      </span>
                      <span className="text-slate-400 font-bold">—</span>
                      <span className="text-sm font-semibold text-slate-900 break-words">
                        {act.description}
                      </span>
                    </div>
                  </div>

                  {/* Ações rápidas (Editar, Histórico, Excluir) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditAction(act)}
                      title="Editar ação"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewActionHistory(act)}
                      title="Histórico de alterações"
                      className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAction(act)}
                      title="Excluir ação"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTÓRICO DOS DIAS ANTERIORES */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Histórico dos Dias Anteriores ({olderActions.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Ações realizadas em outras datas
          </span>
        </div>

        {olderActions.length === 0 ? (
          <div className="bg-slate-50/60 rounded-xl p-6 border border-slate-200/80 text-center">
            <p className="text-xs text-slate-500">
              Não há ações registradas em dias anteriores para esta empresa.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {olderActions.map((act) => (
              <ActionItem
                key={act.id}
                action={act}
                showCompanyName={false}
                onEdit={onEditAction}
                onViewHistory={onViewActionHistory}
                onDelete={onDeleteAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

