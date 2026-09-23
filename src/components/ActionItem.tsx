import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, History, Trash2, Building2, Clock, Users } from 'lucide-react';
import { Action } from '../types/database';
import { formatDateTime } from '../utils/formatters';

interface ActionItemProps {
  action: Action;
  showCompanyName?: boolean;
  onEdit: (action: Action) => void;
  onViewHistory: (action: Action) => void;
  onDelete: (action: Action) => void;
  onCompanyClick?: (companyId: string) => void;
}

export function ActionItem({
  action,
  showCompanyName = false,
  onEdit,
  onViewHistory,
  onDelete,
  onCompanyClick,
}: ActionItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Performer display resolution directly from performed_by TEXT
  const performerName = action.performed_by || 'Colaborador';
  const isTogether = performerName === 'Rafael e Leonardo';
  const isRafael = performerName === 'Rafael';

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-150">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Performer info & Action body */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Avatar pill */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-xs ${
              isTogether
                ? 'bg-purple-700'
                : isRafael
                ? 'bg-cyan-700'
                : 'bg-indigo-700'
            }`}
          >
            {isTogether ? (
              <Users className="w-4 h-4" />
            ) : (
              performerName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header line: Performer & Company */}
            <div className="flex items-center flex-wrap gap-2 mb-1.5">
              <span className="font-bold text-slate-900 text-sm">
                {performerName}
              </span>

              {isTogether && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                  Ação Conjunta
                </span>
              )}

              {showCompanyName && action.company && (
                <button
                  type="button"
                  onClick={() => onCompanyClick?.(action.company_id)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-slate-500" />
                  {action.company.name}
                </button>
              )}
            </div>

            {/* Description of what was executed */}
            <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
              {action.description}
            </p>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDateTime(action.action_at)}</span>
            </div>
          </div>
        </div>

        {/* Right: 3-dots Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            aria-label="Opções da ação"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(action);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onViewHistory(action);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                Histórico
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(action);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
