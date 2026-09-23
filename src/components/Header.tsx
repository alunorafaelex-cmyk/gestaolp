import React from 'react';
import { Menu, PlusCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenNewAction: () => void;
  onNewCompany?: () => void;
  showNewCompanyBtn?: boolean;
}

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenNewAction,
  onNewCompany,
  showNewCompanyBtn,
}: HeaderProps) {
  const { displayName } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Titles */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {showNewCompanyBtn && onNewCompany && (
            <button
              type="button"
              onClick={onNewCompany}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Nova Empresa</span>
              <span className="sm:hidden">+ Empresa</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Registrar Ação</span>
          </button>
        </div>
      </div>
    </header>
  );
}
