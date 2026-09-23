import React from 'react';
import {
  LayoutDashboard,
  Building2,
  ListTodo,
  History,
  Trash2,
  LogOut,
  User,
  PlusCircle,
  Database,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab = 'overview' | 'companies' | 'actions' | 'history' | 'trash';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewAction: () => void;
  onOpenSqlModal: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenNewAction,
  onOpenSqlModal,
}: SidebarProps) {
  const { displayName, user, signOut } = useAuth();

  const navItems: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'actions', label: 'Todas as Ações', icon: ListTodo },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'trash', label: 'Lixeira', icon: Trash2 },
  ];

  const handleNavClick = (tabId: NavigationTab) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const isRafael = displayName.toLowerCase().includes('rafael');

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top brand */}
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-base shadow-inner">
                LP
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-white uppercase leading-tight">
                  GESTÃO LP
                </h1>
                <p className="text-xs font-semibold text-cyan-400 tracking-wider">
                  MARKETING
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                onOpenNewAction();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + REGISTRAR AÇÃO
            </button>
          </div>

          {/* Navigation items */}
          <nav className="px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {/* Supabase status / schema button */}
          <button
            type="button"
            onClick={onOpenSqlModal}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/80 rounded-lg transition"
          >
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Banco Supabase
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
              SQL
            </span>
          </button>

          {/* User profile & Sair */}
          <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white ${
                  isRafael ? 'bg-cyan-600' : 'bg-indigo-600'
                }`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'Conectado'}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => signOut()}
              title="Sair do sistema"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1 shrink-0"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
