import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck, Database, Info } from 'lucide-react';

interface LoginProps {
  onOpenSqlModal?: () => void;
}

export function Login({ onOpenSqlModal }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Preencha seu e-mail e senha de acesso.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMsg(
          res.error.message.includes('Invalid login credentials')
            ? 'Credenciais incorretas. Verifique seu e-mail e senha cadastrados no Supabase.'
            : res.error.message
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-white">
      {/* Container */}
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-slate-900 px-8 pt-8 pb-7 text-white border-b border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold tracking-tight text-sm">
                  LP
                </div>
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
                  Acesso Restrito
                </span>
              </div>
              <span className="px-2.5 py-1 bg-slate-800 text-[11px] font-medium text-slate-300 rounded-full border border-slate-700/60">
                v1.0
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              GESTÃO LP <br />
              <span className="text-cyan-400">MARKETING</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Sistema interno de registro de ações e atendimentos para clientes da agência.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {!isSupabaseConfigured && (
              <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-4 h-4 text-amber-600" />
                  Supabase ainda não configurado
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Configure as variáveis <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
                </p>
                {onOpenSqlModal && (
                  <button
                    type="button"
                    onClick={onOpenSqlModal}
                    className="text-cyan-800 font-semibold underline text-xs block hover:text-cyan-900"
                  >
                    Ver script SQL & Inserir credenciais
                  </button>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: rafael@lpmarketing.com.br"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-cyan-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>AUTENTICANDO...</span>
                    </>
                  ) : (
                    <>
                      <span>ENTRAR</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Note about private access */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Acesso exclusivo para Rafael e Leonardo
              </span>
              {onOpenSqlModal && (
                <button
                  type="button"
                  onClick={onOpenSqlModal}
                  className="text-cyan-700 hover:text-cyan-800 font-medium"
                >
                  Ajuda Supabase
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          LP Marketing • Gestão de Ações Realizadas
        </p>
      </div>
    </div>
  );
}
