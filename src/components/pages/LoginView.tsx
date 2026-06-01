/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { isDemoMode, supabaseService } from '../../lib/supabase';
import { Profile } from '../../types';
import { navigate } from '../../lib/navigation';
import { 
  Shield, 
  Sparkles, 
  User, 
  LogIn, 
  AlertCircle,
  Lock
} from 'lucide-react';

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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12 page-transition bg-gradient-to-br from-[#1E0B36] via-[#030108] to-[#052026] relative overflow-hidden select-none">
      
      {/* Background gradients and blurs */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-900/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-teal-900/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
        
        {/* Coluna Esquerda: Apresentação */}
        <div className="flex flex-col items-start text-left lg:pr-4">
          
          {/* 2. Header Interno */}
          <div className="flex flex-col gap-2.5 mb-6 md:mb-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#60a5fa] flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.25)]">
                <span className="font-display font-black text-xl text-slate-950 tracking-tighter">R</span>
              </div>
              <span className="font-display font-black text-base tracking-widest text-[#f8fafc] uppercase">RESERVA ROXOU</span>
            </div>
            <div className="inline-flex">
              <span className="px-3 py-1 bg-slate-900/80 border border-slate-800/80 text-[10px] font-extrabold tracking-widest text-slate-200 rounded-md uppercase">
                PASSAGEIRO
              </span>
            </div>
          </div>

          {/* 3. Hero */}
          {/* Social Proof +500 Trips Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/15 rounded-full text-[11px] text-[#c084fc] font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Mais de 500 corporativas realizadas com sucesso</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight leading-[1.1] mb-3">
            Reserva <span className="bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">Roxou</span>
          </h1>
          
          <h2 className="font-display font-bold text-lg sm:text-xl text-slate-200 tracking-wide mb-4">
            Seu motorista particular disponível quando você precisar.
          </h2>
          
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed mb-6 md:mb-8">
            Solicite orçamentos, acompanhe reservas, converse diretamente com o motorista e tenha todo seu histórico salvo em uma única plataforma.
          </p>

          {/* 4. Resumo de Serviços */}
          <div className="w-full bg-[#110e1c]/40 backdrop-blur-md border border-purple-500/10 rounded-2xl p-4 mb-6 lg:mb-0">
            <p className="text-[10px] text-[#a78bfa] font-extrabold uppercase tracking-widest text-center mb-3">
              RESUMO DE SERVIÇOS
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-950/40 border border-slate-900/30">
                <span className="text-base mb-1">⭐</span>
                <span className="text-[10px] font-bold text-slate-350 tracking-wide uppercase">Particular</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-950/40 border border-slate-900/30">
                <span className="text-base mb-1">🚗</span>
                <span className="text-[10px] font-bold text-slate-350 tracking-wide uppercase">Executivo</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center p-2 rounded-xl bg-slate-950/40 border border-slate-900/30">
                <span className="text-base mb-1">🛡️</span>
                <span className="text-[10px] font-bold text-slate-350 tracking-wide uppercase">Seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Card de Login Premium */}
        <div className="flex justify-center w-full">
          <div className="w-full bg-[#0a0814]/75 backdrop-blur-xl border border-purple-900/30 rounded-[28px] p-6 md:p-8 shadow-[0_15px_45px_rgba(30,11,54,0.4)] relative overflow-hidden flex flex-col justify-between group transition-all duration-300">
            
            {/* Superior border decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent" />
            <div className="absolute -top-12 left-1/3 w-32 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header Area */}
            <div className="text-left mb-6 relative z-10">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-wider text-[10px] uppercase mb-1.5">
                <Lock className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span>Autenticação Identidade</span>
              </div>
              <h3 className="font-display font-black text-xl text-slate-100 tracking-tight">ACESSE SUA CONTA</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Entre com Google para solicitar ou acompanhar suas reservas corporativas e privadas de forma segura e criptografada.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-rose-950/30 border border-rose-900/40 text-rose-400 rounded-xl text-xs text-left flex gap-2.5 items-start animate-fade-in relative z-10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Button */}
            <div className="relative z-10 space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-[#030108] hover:bg-[#12101e] text-slate-100 border border-slate-900 hover:border-purple-500/40 rounded-2xl py-3.5 px-5 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer active:scale-[0.98] hover:shadow-[0_0_15px_rgba(167,139,250,0.12)] focus:outline-none"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.514 5.514 0 0 1 8.5 13c0-3.046 2.454-5.514 5.5-5.514 1.405 0 2.682.527 3.655 1.405l3.127-3.127A9.877 9.877 0 0 0 14 2c-5.514 0-10 4.486-10 10s4.486 10 10 10c5.514 0 10-4.486 10-10 0-.648-.052-1.272-.155-1.714H12.24Z"
                    />
                  </svg>
                )}
                <span>Acessar com o Google</span>
              </button>

              <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium tracking-wide uppercase px-1">
                <span>Criptografia SSL de 256 bits</span>
                <span>Chave RSA Privada</span>
              </div>
            </div>

            {/* Indicator Supabase */}
            <div className="mt-6 flex justify-center relative z-10 pt-4 border-t border-slate-900/60">
              {!isDemoMode ? (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span>Conectado ao Banco de Dados (Supabase Real)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-mono font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Modo Demonstrativo Ativo</span>
                </div>
              )}
            </div>

            {/* Fast Bypass Dev-Mode inside the card if demo enabled */}
            {isDemoMode && (
              <div className="mt-5 pt-4 border-t border-slate-900/80 relative z-10">
                <div className="flex items-center gap-1.5 justify-center mb-1.5 text-[9px] tracking-wider uppercase text-amber-500 font-extrabold font-mono">
                  <span>Fast Bypass Dev-Mode</span>
                </div>
                
                <p className="text-[9px] text-slate-500 text-center mb-3 leading-relaxed">
                  Chaves ambientais do Supabase indisponíveis nesta Sandbox de prévia rápida. Acesse um perfil fake abaixo para testar as telas:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDemoLogin('passageiro')}
                    className="bg-purple-950/10 hover:bg-purple-950/25 text-purple-300 border border-purple-900/20 rounded-xl py-2 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Passageiro</span>
                  </button>

                  <button
                    onClick={() => handleDemoLogin('admin')}
                    className="bg-slate-900/50 hover:bg-[#12101b] text-emerald-400 border border-slate-800 rounded-xl py-2 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Executivo (Admin)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Geral */}
      <div className="text-center mt-10 md:mt-12 text-[10px] text-slate-500 font-mono relative z-10 flex items-center justify-center gap-2">
        <span>Ambiente Seguro</span>
        <span>&bull;</span>
        <span>reserva.roxou.com.br</span>
      </div>
    </div>
  );
}

export default LoginView;
