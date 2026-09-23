import React from 'react';
import {
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Building2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Action, Company, DashboardStats } from '../types/database';
import { formatRelativeDateTime, formatDateTime } from '../utils/formatters';

interface DashboardProps {
  stats: DashboardStats;
  recentActions: Action[];
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onOpenNewAction: () => void;
  onViewAllActions: () => void;
  onViewAllCompanies: () => void;
  onEditAction: (action: Action) => void;
  onViewActionHistory: (action: Action) => void;
  onDeleteAction: (action: Action) => void;
}

export function Dashboard({
  stats,
  recentActions,
  companies,
  onSelectCompany,
  onOpenNewAction,
  onViewAllActions,
  onViewAllCompanies,
  onEditAction,
  onViewActionHistory,
  onDeleteAction,
}: DashboardProps) {
  const { displayName } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Greeting */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Ambiente Compartilhado • Rafael & Leonardo
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, {displayName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualização unificada de todas as ações realizadas para as empresas atendidas pela LP Marketing.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewAction}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer shrink-0"
        >
          + REGISTRAR AÇÃO
        </button>
      </div>

      {/* Seção "Ações de hoje" */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ações de hoje</h3>
              <p className="text-xs text-slate-500">
                Produtividade e participações registradas no dia de hoje
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Total hoje: <strong className="text-slate-900 font-extrabold">{stats.todayCount}</strong> {stats.todayCount === 1 ? 'ação' : 'ações'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rafael */}
          <div className="p-4 rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50/40 via-white to-white hover:border-cyan-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Rafael
              </span>
              <span className="text-[10px] uppercase font-bold text-cyan-700 bg-cyan-100/70 px-2 py-0.5 rounded-full">
                Participações
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{stats.todayRafael}</span>
              <span className="text-xs text-slate-500">
                {stats.todayRafael === 1 ? 'participação' : 'participações'}
              </span>
            </div>
          </div>

          {/* Leonardo */}
          <div className="p-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/40 via-white to-white hover:border-violet-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                Leonardo
              </span>
              <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-full">
                Participações
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{stats.todayLeonardo}</span>
              <span className="text-xs text-slate-500">
                {stats.todayLeonardo === 1 ? 'participação' : 'participações'}
              </span>
            </div>
          </div>

          {/* Em conjunto */}
          <div className="p-4 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/40 via-white to-white hover:border-purple-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Em conjunto
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                Ações conjuntas
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{stats.todayTogether}</span>
              <span className="text-xs text-slate-500">
                {stats.todayTogether === 1 ? 'ação' : 'ações'}
              </span>
            </div>
          </div>

          {/* Total de ações hoje */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/60 via-white to-white hover:border-slate-300 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                Total de ações hoje
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                Registros
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{stats.todayCount}</span>
              <span className="text-xs text-slate-500">
                {stats.todayCount === 1 ? 'ação hoje' : 'ações hoje'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row: Períodos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Hoje */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ações realizadas hoje
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.todayCount}
            </span>
            <span className="text-xs text-slate-500">ações registradas</span>
          </div>
        </div>

        {/* Últimos 7 dias */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Últimos 7 dias
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <CalendarRange className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.last7DaysCount}
            </span>
            <span className="text-xs text-slate-500">ações nos últimos 7 dias</span>
          </div>
        </div>

        {/* Neste mês */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ações neste mês
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.thisMonthCount}
            </span>
            <span className="text-xs text-slate-500">ações no mês atual</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Atividades Recentes + Empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: ATIVIDADES RECENTES */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Atividades Recentes
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllActions}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 transition"
            >
              Ver todas as ações
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentActions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Nenhuma ação registrada ainda.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Clique no botão acima para registrar o primeiro trabalho concluído por Rafael ou Leonardo.
              </p>
              <button
                type="button"
                onClick={onOpenNewAction}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Registrar primeira ação
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActions.slice(0, 10).map((act) => {
                const performerName = act.performed_by || 'Colaborador';
                const isTogether = performerName === 'Rafael e Leonardo';
                const isRafael = performerName === 'Rafael';

                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5 shadow-xs ${
                          isTogether
                            ? 'bg-purple-700'
                            : isRafael
                            ? 'bg-cyan-700'
                            : 'bg-indigo-700'
                        }`}
                      >
                        {isTogether ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          performerName.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* 1. Colaborador */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {performerName}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                              isTogether
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : isRafael
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isTogether ? 'Ação Conjunta' : 'Colaborador'}
                          </span>
                        </div>

                        {/* 2. Descrição da ação */}
                        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                          {act.description}
                        </p>

                        {/* 3. Empresa & Data/Hora */}
                        <div className="flex items-center gap-2.5 flex-wrap pt-0.5 text-xs text-slate-500">
                          {act.company && (
                            <button
                              type="button"
                              onClick={() => onSelectCompany(act.company_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-semibold text-slate-700 border border-slate-200 transition cursor-pointer"
                            >
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {act.company.name}
                            </button>
                          )}
                          <div className="flex items-center gap-1 text-slate-400">
                            <span>•</span>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 font-medium">
                              {formatRelativeDateTime(act.action_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <button
                        type="button"
                        onClick={() => onSelectCompany(act.company_id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Ver Empresa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: EMPRESAS CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Empresas
              </h3>
            </div>
            <button
              type="button"
              onClick={onViewAllCompanies}
              className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 transition"
            >
              Ver todas ({companies.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {companies.slice(0, 7).map((comp) => (
              <div
                key={comp.id}
                onClick={() => onSelectCompany(comp.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-cyan-400 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition">
                    {comp.name}
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {comp.action_count_month ?? 0} {comp.action_count_month === 1 ? 'ação no mês' : 'ações no mês'}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  {comp.last_action ? (
                    <div className="space-y-0.5">
                      <p className="text-slate-700 truncate font-medium">
                        <span className="text-slate-500">
                          {(comp.last_action.performed_by || 'Colaborador')}:
                        </span>{' '}
                        {comp.last_action.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatRelativeDateTime(comp.last_action.action_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">
                      Nenhuma ação registrada
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
