import React, { useState, useEffect } from 'react';
import { X, Building2, FileText, Clock, User } from 'lucide-react';
import { Company, Action, PerformerName } from '../../types/database';
import { toDatetimeLocalInput, fromDatetimeLocalInput } from '../../utils/formatters';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    companyId: string;
    performedBy: string; // 'Rafael' | 'Leonardo' | 'Rafael e Leonardo'
    description: string;
    actionAt: string;
  }) => Promise<void>;
  companies: Company[];
  initialCompanyId?: string;
  actionToEdit?: Action | null;
}

export function ActionModal({
  isOpen,
  onClose,
  onSave,
  companies,
  initialCompanyId,
  actionToEdit,
}: ActionModalProps) {
  const [companyId, setCompanyId] = useState<string>('');
  const [selectedPerformer, setSelectedPerformer] = useState<PerformerName>('Rafael');
  const [description, setDescription] = useState<string>('');
  const [actionAt, setActionAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (actionToEdit) {
        setCompanyId(actionToEdit.company_id);
        const perf = actionToEdit.performed_by;
        if (perf === 'Leonardo') {
          setSelectedPerformer('Leonardo');
        } else if (perf === 'Rafael e Leonardo') {
          setSelectedPerformer('Rafael e Leonardo');
        } else {
          setSelectedPerformer('Rafael');
        }
        setDescription(actionToEdit.description || '');
        const dateObj = new Date(actionToEdit.action_at);
        setActionAt(toDatetimeLocalInput(dateObj));
      } else {
        setCompanyId(initialCompanyId || (companies.length > 0 ? companies[0].id : ''));
        setSelectedPerformer('Rafael');
        setDescription('');
        setActionAt(toDatetimeLocalInput(new Date()));
      }
    }
  }, [isOpen, actionToEdit, initialCompanyId, companies]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setErrorMsg('Selecione a empresa atendida.');
      return;
    }
    if (!selectedPerformer) {
      setErrorMsg('Selecione quem realizou a ação.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Descreva a ação que foi realizada.');
      return;
    }

    const payload = {
      companyId,
      performedBy: selectedPerformer,
      description: description.trim(),
      actionAt: fromDatetimeLocalInput(actionAt),
    };

    console.log('ActionModal form submit:', payload);

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao salvar a ação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(actionToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Ação Realizada' : 'Registrar Ação Realizada'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro definitivo de ações já executadas para o cliente
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Empresa */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Empresa
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
            >
              <option value="" disabled>
                Selecione a empresa...
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quem Realizou? Exactly 3 options: Rafael, Leonardo, Rafael e Leonardo */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Quem realizou?
            </label>

            {/* Visual selector buttons */}
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Rafael */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedPerformer('Rafael')}
                className={`py-2.5 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedPerformer === 'Rafael'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedPerformer === 'Rafael' ? 'bg-cyan-400' : 'bg-slate-400'
                  }`}
                />
                <span>Rafael</span>
              </button>

              {/* Option 2: Leonardo */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedPerformer('Leonardo')}
                className={`py-2.5 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedPerformer === 'Leonardo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedPerformer === 'Leonardo' ? 'bg-cyan-400' : 'bg-slate-400'
                  }`}
                />
                <span>Leonardo</span>
              </button>

              {/* Option 3: Rafael e Leonardo */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedPerformer('Rafael e Leonardo')}
                className={`py-2.5 px-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedPerformer === 'Rafael e Leonardo'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedPerformer === 'Rafael e Leonardo' ? 'bg-cyan-400' : 'bg-slate-400'
                  }`}
                />
                <span className="text-center leading-tight">Rafael e Leonardo</span>
              </button>
            </div>

            {/* Dropdown Select */}
            <div className="mt-2">
              <select
                value={selectedPerformer}
                onChange={(e) => setSelectedPerformer(e.target.value as PerformerName)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value="Rafael">Rafael</option>
                <option value="Leonardo">Leonardo</option>
                <option value="Rafael e Leonardo">Rafael e Leonardo</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Descrição da Ação Realizada
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que foi realizado... (Ex: Ajustou campanha de vendas no Meta Ads)"
              required
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition resize-none placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Data e Horário */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Data e Horário
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={actionAt}
                onChange={(e) => setActionAt(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Registrar Ação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
