import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  FolderOpen,
  CalendarCheck,
} from 'lucide-react';
import { Company } from '../types/database';
import { formatRelativeDateTime } from '../utils/formatters';

interface CompaniesListProps {
  companies: Company[];
  loading: boolean;
  onSelectCompany: (companyId: string) => void;
  onNewCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (company: Company) => void;
}

export function CompaniesList({
  companies,
  loading,
  onSelectCompany,
  onNewCompany,
  onEditCompany,
  onDeleteCompany,
}: CompaniesListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-cyan-500" />
            Clientes Atendidos
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Empresas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Todas as empresas com acompanhamento e registros da LP Marketing.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewCompany}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          + NOVA EMPRESA
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar empresa por nome..."
          className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-md"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto mb-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Carregando lista de empresas...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            {searchTerm ? 'Nenhuma empresa encontrada com essa busca.' : 'Nenhuma empresa cadastrada no momento.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Tente buscar com outro termo.' : 'Clique em "+ NOVA EMPRESA" para cadastrar.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={onNewCompany}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
            >
              Adicionar Empresa
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header line */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    onClick={() => onSelectCompany(company.id)}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-cyan-700 transition">
                      {company.name}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditCompany(company)}
                      title="Editar nome"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCompany(company)}
                      title="Excluir empresa"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Monthly count indicator */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
                  <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>
                    <strong>{company.action_count_month ?? 0}</strong> {company.action_count_month === 1 ? 'ação realizada este mês' : 'ações realizadas este mês'}
                  </span>
                </div>

                {/* Last action snippet */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs">
                  <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Última Ação:
                  </span>
                  {company.last_action ? (
                    <div>
                      <p className="text-slate-800 line-clamp-2 font-medium">
                        <span className="text-slate-500">
                          {(company.last_action.performed_by || 'Colaborador')}:
                        </span>{' '}
                        {company.last_action.description}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatRelativeDateTime(company.last_action.action_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">Nenhuma ação registrada ainda.</p>
                  )}
                </div>
              </div>

              {/* View company actions button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectCompany(company.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
                >
                  <span>Ver todas as ações da empresa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
