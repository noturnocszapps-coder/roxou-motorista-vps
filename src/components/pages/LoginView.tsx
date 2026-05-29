/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { isDemoMode, supabaseService } from '../../lib/supabase';
import { Profile } from '../../types';
import { navigate } from '../../lib/navigation';
import { Shield, Sparkles, User, LogIn, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  currentUser: Profile | null;
  onRefreshUser: () => void;
}

export function LoginView({ currentUser, onRefreshUser }: LoginViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirecionar se já logado
  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabaseService.signInWithGoogle();
      if (err) {
        setError(err.message || 'Houve um erro ao conectar com o Google.');
      } else if (isDemoMode) {
        // Logar passageiro padrão
        supabaseService.demoLoginAs('passageiro', 'passageiro@exemplo.com');
        onRefreshUser();
        navigate('/');
      }
    } catch (e: any) {
      setError('Falha de conexão com os servidores.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'passageiro') => {
    if (role === 'admin') {
      supabaseService.demoLoginAs('admin', 'contato.fh3@gmail.com');
    } else {
      supabaseService.demoLoginAs('passageiro', 'passageiro@exemplo.com');
    }
    onRefreshUser();
    
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 flex flex-col justify-center min-h-[80vh] page-transition">
      {/* Branding */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-roxou-card border border-roxou-purple/40 flex items-center justify-center mx-auto mb-4 shadow-neon-purple/20">
          <span className="font-display font-black text-3xl text-roxou-neon tracking-tighter">R</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">
          RESERVA <span className="text-roxou-neon">ROXOU</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
          Serviço privado e exclusivo de motorista particular e executivo.
        </p>
      </div>

      {/* Caixa do Formulário */}
      <div className="bg-roxou-card border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-roxou-purple to-transparent opacity-80" />
        
        <h2 className="font-display font-bold text-xl text-slate-100 text-left mb-2">Acesse suas viagens</h2>
        <p className="text-xs text-slate-400 text-left mb-6 leading-relaxed">
          Para realizar reservas e consultar valores, identifique-se através de sua conta com autenticação segura.
        </p>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 rounded-xl text-xs text-left flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Botão de Login do Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-850 text-slate-100 border border-slate-800 rounded-xl py-3.5 px-4 font-semibold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.514 5.514 0 0 1 8.5 13c0-3.046 2.454-5.514 5.5-5.514 1.405 0 2.682.527 3.655 1.405l3.127-3.127A9.877 9.877 0 0 0 14 2c-5.514 0-10 4.486-10 10s4.486 10 10 10c5.514 0 10-4.486 10-10 0-.648-.052-1.272-.155-1.714H12.24Z"
              />
            </svg>
          )}
          <span>Entrar com o Google</span>
        </button>

        {/* Links ou Modos Alternativos para o Modo Demo */}
        {isDemoMode && (
          <div className="mt-8 pt-6 border-t border-slate-850">
            <div className="flex items-center gap-1.5 justify-center mb-3 text-[10px] tracking-wider uppercase text-amber-500 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Painel de Teste Rápido (Sem Google)</span>
            </div>
            
            <p className="text-[11px] text-slate-500 text-center mb-4 leading-relaxed">
              O backend do Supabase não está configurado. Use estes atalhos para simular a autenticação imediata:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => handleDemoLogin('passageiro')}
                className="bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 border border-purple-900/30 rounded-xl py-3 px-4 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-left font-display">
                    <span className="font-bold text-slate-200">Acessar como Passageiro</span>
                    <span className="block text-[9px] text-purple-400 font-mono">passageiro@exemplo.com</span>
                  </span>
                </div>
                <LogIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleDemoLogin('admin')}
                className="bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-950/40 rounded-xl py-3 px-4 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-left font-display">
                    <span className="font-bold text-slate-200">Acessar como Motorista (Admin)</span>
                    <span className="block text-[9px] text-emerald-500 font-mono">contato.fh3@gmail.com</span>
                  </span>
                </div>
                <LogIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-6 text-[10px] text-slate-505 text-slate-500 font-mono">
        Ambiente Seguro • reserva.roxou.com.br
      </div>
    </div>
  );
}
export default LoginView;
