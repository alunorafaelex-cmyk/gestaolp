import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Search,
  Filter,
  X,
  Building2,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { Company, Action } from '../types/database';
import { api } from '../services/api';
import { ActionItem } from './ActionItem';

interface AllActionsPageProps {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onEditAction: (action: Action) => void;
  onViewActionHistory: (action: Action) => void;
  onDeleteAction: (action: Action) => void;
  refreshTrigger: number;
}

export function AllActionsPage({
  companies,
  onSelectCompany,
  onEditAction,
  onViewActionHistory,
  onDeleteAction,
  refreshTrigger,
}: AllActionsPageProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPerformerFilter, setSelectedPerformerFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadActions();
  }, [selectedCompanyId, selectedPerformerFilter, startDate, endDate, refreshTrigger]);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await api.fetchActions({
        companyId: selectedCompanyId || undefined,
        performerFilter: selectedPerformerFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
        includeDeleted: false,
      });
      setActions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadActions();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCompanyId('');
    setSelectedPerformerFilter('todos');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    search || selectedCompanyId || selectedPerformerFilter !== 'todos' || startDate || endDate
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">
          <ListTodo className="w-4 h-4 text-cyan-500" />
          Registros Globais
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Todas as Ações
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Histórico unificado de todas as atividades realizadas para todos os clientes da LP Marketing.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar ações pelo texto da descrição... (Pressione Enter)"
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
          >
            Buscar
          </button>
        </form>

        {/* Filters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Empresa */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Empresa
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todas as empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Colaborador */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Colaborador
            </label>
            <select
              value={selectedPerformerFilter}
              onChange={(e) => setSelectedPerformerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            >
              <option value="todos">Todos</option>
              <option value="Rafael">Rafael</option>
              <option value="Leonardo">Leonardo</option>
              <option value="Rafael e Leonardo">Rafael e Leonardo</option>
            </select>
          </div>

          {/* Data inicial */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Data final */}
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Clear filters banner */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Filtros ativos aplicados</span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Actions Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {actions.length} {actions.length === 1 ? 'Ação encontrada' : 'Ações encontradas'}
          </span>
          <span className="text-xs text-slate-400">
            Ordenação: Mais recentes primeiro
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <svg className="animate-spin h-6 w-6 text-cyan-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs text-slate-500">Filtrando ações...</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              Nenhuma ação encontrada com os filtros informados.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tente redefinir os filtros ou alterar a palavra-chave pesquisada.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((act) => (
              <ActionItem
                key={act.id}
                action={act}
                showCompanyName={true}
                onEdit={onEditAction}
                onViewHistory={onViewActionHistory}
                onDelete={onDeleteAction}
                onCompanyClick={onSelectCompany}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
