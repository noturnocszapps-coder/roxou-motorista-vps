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
  Clock,
  History,
  MessageSquare,
  Database,
  Star,
  Sparkle,
  Car,
  CheckCircle2,
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
    <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 md:py-16 page-transition bg-gradient-to-b from-[#06050a] via-[#090812] to-[#050409] relative overflow-hidden">
      {/* Dynamic and futuristic background elements */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-roxou-neon/30 to-transparent" />
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-roxou-purple/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-505/5 bg-opacity-10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Tech Grid Backdrop Accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
        
        {/* Coluna Esquerda: Apresentação & Prova Social */}
        <div className="lg:col-span-7 flex flex-col items-start text-left lg:pr-4">
          
          {/* Logo Badge */}
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#110e1c] border border-roxou-purple/40 flex items-center justify-center shadow-neon-purple/20">
              <span className="font-display font-black text-2xl text-roxou-neon tracking-tighter">R</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-[10px] tracking-widest text-[#a78bfa] uppercase">CORPORATE SERVICE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-roxou-green animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">PREMIUM MOBILITY</p>
            </div>
          </div>

          {/* Social Proof +500 Trips Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-roxou-purple/10 border border-roxou-purple/20 rounded-full text-xs text-[#c084fc] font-semibold mb-6">
            <Sparkle className="w-3.5 h-3.5 text-roxou-neon" />
            <span>Mais de 500 corporativas realizadas com sucesso</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1] mb-4">
            Reserva <span className="bg-gradient-to-r from-roxou-neon via-[#9333ea] to-[#60a5fa] bg-clip-text text-transparent">Roxou</span>
          </h1>
          
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-200 tracking-wide mb-5">
            Seu motorista particular disponível quando você precisar.
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed mb-8">
            Solicite orçamentos, acompanhe reservas, converse diretamente com o motorista e tenha todo seu histórico salvo em uma única plataforma.
          </p>

          {/* Prova Social Keypoints */}
          <div className="flex flex-wrap gap-3.5 mb-10 w-full">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-850/50 rounded-xl text-xs text-slate-300 font-semibold backdrop-blur-sm">
              <span className="text-yellow-500 text-sm">⭐</span>
              <span>Atendimento Particular</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-850/50 rounded-xl text-xs text-slate-300 font-semibold backdrop-blur-sm">
              <span className="text-emerald-500 text-sm">🔒</span>
              <span>Reserva Segura</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-850/50 rounded-xl text-xs text-slate-300 font-semibold backdrop-blur-sm">
              <span className="text-purple-500 text-sm">🚗</span>
              <span>Motorista Executivo</span>
            </div>
          </div>

          {/* Premium Vector Sedan Illustration */}
          <div className="w-full max-w-lg mb-10 relative group rounded-2xl overflow-hidden bg-slate-950/25 border border-slate-850/50 p-4 backdrop-blur-sm hidden sm:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-roxou-purple/5 to-transparent pointer-events-none" />
            
            {/* Inline SVG Sedan representing the Premium Ride service */}
            <svg viewBox="0 0 500 220" className="w-full h-auto opacity-90 drop-shadow-[0_0_15px_rgba(168,85,247,0.15)]" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground Reflection Grid */}
              <path d="M50 170 H450 M100 180 H400 M150 190 H350" stroke="rgba(168,85,247,0.12)" strokeWidth="1" />
              <path d="M100 170 L80 195 M150 170 L140 195 M200 170 L200 195 M250 170 L260 195 M300 170 L320 195 M350 170 L380 195" stroke="rgba(168,85,247,0.12)" strokeWidth="1" />
              
              {/* Neon Underglow glow */}
              <ellipse cx="250" cy="172" rx="160" ry="8" fill="url(#underglowGlow)" opacity="0.8" />
              
              {/* Sedan Body Silhouette & Accents */}
              <g stroke="currentColor" className="text-slate-700" strokeWidth="1.5">
                {/* Main sleek roof & body arches */}
                <path d="M90 155 Q110 152 140 148 Q155 125 180 108 Q210 93 250 92 Q290 92 340 108 Q375 128 395 145 Q420 150 440 155 Q442 165 435 170 Q410 173 100 173 Q85 168 90 155 Z" fill="#0c0a18" stroke="#312e4f" strokeWidth="2" />
                
                {/* Windshield & Windows */}
                <path d="M185 110 L245 110 L245 142 L160 142 Z" fill="#18152c" stroke="#581c87" strokeWidth="1.5" />
                <path d="M255 110 L325 110 L355 142 L255 142 Z" fill="#18152c" stroke="#581c87" strokeWidth="1.5" />
                
                {/* Glossy Reflection Highlight Lines */}
                <path d="M185 110 Q250 95 330 110" stroke="#a78bfa" strokeWidth="1.5" opacity="0.6" />
                <path d="M100 156 Q250 144 430 156" stroke="#9333ea" strokeWidth="1.5" opacity="0.8" />
                
                {/* Wheels */}
                <circle cx="150" cy="170" r="18" fill="#08070d" stroke="#5816bb" strokeWidth="2.5" />
                <circle cx="150" cy="170" r="10" fill="#120e29" stroke="#d8b4fe" strokeWidth="1.5" />
                <path d="M150 152 L150 188 M132 170 L168 170" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
                
                <circle cx="340" cy="170" r="18" fill="#08070d" stroke="#5816bb" strokeWidth="2.5" />
                <circle cx="340" cy="170" r="10" fill="#120e29" stroke="#d8b4fe" strokeWidth="1.5" />
                <path d="M340 152 L340 188 M322 170 L358 170" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
                
                {/* Lights (Headlights & Taillights) */}
                <path d="M88 158 Q95 159 100 162" stroke="#60a5fa" strokeWidth="2.5" /> {/* Xenon headlight */}
                <path d="M441 156 Q435 156 433 160" stroke="#f43f5e" strokeWidth="2.5" /> {/* LED Taillight */}
                
                {/* Light beam simulation */}
                <polygon points="85,160 10,140 10,200" fill="url(#xenonBeam)" opacity="0.15" />
              </g>
              
              {/* Gradient Declarations */}
              <defs>
                <radialGradient id="underglowGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="xenonBeam" x1="85" y1="160" x2="10" y2="170" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
              <span className="w-1.5 h-1.5 bg-roxou-neon rounded-full animate-ping" />
              <span>VEÍCULO EXECUTIVO ATIVO</span>
            </div>
          </div>

          {/* Cards de Benefícios Melhorados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="bg-[#0f0d1a]/60 backdrop-blur-md border border-slate-850/60 hover:border-roxou-purple/35 p-4 rounded-2xl flex gap-3.5 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-xl bg-roxou-purple/10 border border-roxou-purple/20 flex items-center justify-center shrink-0 group-hover:bg-roxou-purple/20 transition-colors">
                <Clock className="w-5.5 h-5.5 text-roxou-neon" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-slate-100 text-xs tracking-wider uppercase">Orçamento Rápido</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Receba valores espontaneamente.</p>
              </div>
            </div>

            <div className="bg-[#0f0d1a]/60 backdrop-blur-md border border-slate-850/60 hover:border-roxou-purple/35 p-4 rounded-2xl flex gap-3.5 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <Shield className="w-5.5 h-5.5 text-roxou-green" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-slate-100 text-xs tracking-wider uppercase">Atendimento Privado</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Serviço exclusivo e personalizado.</p>
              </div>
            </div>

            <div className="bg-[#0f0d1a]/60 backdrop-blur-md border border-slate-850/60 hover:border-roxou-purple/35 p-4 rounded-2xl flex gap-3.5 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <History className="w-5.5 h-5.5 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-slate-100 text-xs tracking-wider uppercase">Histórico Salvo</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Acompanhe todas as suas reservas.</p>
              </div>
            </div>

            <div className="bg-[#0f0d1a]/60 backdrop-blur-md border border-slate-850/60 hover:border-roxou-purple/35 p-4 rounded-2xl flex gap-3.5 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 group-hover:bg-sky-500/20 transition-colors">
                <MessageSquare className="w-5.5 h-5.5 text-sky-400" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-slate-100 text-xs tracking-wider uppercase">Chat Interno</h4>
                <p className="text-[11px] text-slate-400 leading-normal">Comunique-se diretamente pelo aplicativo.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Card de Login Premium com efeito Glassmorphism */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="max-w-lg w-full bg-[#110e1a]/70 backdrop-blur-2xl border border-slate-800/80 rounded-[28px] p-8 md:p-10 shadow-[0_20px_50px_rgba(9,8,18,0.7)] relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-slate-700/80">
            
            {/* Superior Gradient line on card header */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-roxou-purple to-transparent opacity-100" />
            <div className="absolute -top-12 left-1/3 w-32 h-24 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
            
            {/* Subtle glow bottom layer */}
            <div className="absolute -bottom-24 -right-16 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Area */}
            <div className="text-left mb-8 relative z-10">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold tracking-wider text-[10px] uppercase mb-1.5">
                <Lock className="w-3.5 h-3.5 text-roxou-neon" />
                <span>Autenticação Identidade</span>
              </div>
              <h3 className="font-display font-black text-2xl text-slate-100 tracking-tight">Acesse sua conta</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Entre com Google para solicitar ou acompanhar suas reservas corporativas e privadas de forma criptografada.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-950/25 border border-rose-900/30 text-rose-400 rounded-xl text-xs text-left flex gap-2.5 items-start animate-fade-in relative z-10">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Google Authentication Big Button */}
            <div className="relative z-10 space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-[#0a0912] hover:bg-[#141224] text-slate-100 border border-slate-800 hover:border-roxou-purple/40 rounded-2xl py-4 px-5 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-250 cursor-pointer active:scale-[0.98] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:outline-none focus:ring-1 focus:ring-roxou-purple/40"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
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

              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
                <span>Criptografia SSL de 256 bits</span>
                <span>Chave RSA Privada</span>
              </div>
            </div>

            {/* Status Connection Badges with active glows */}
            <div className="mt-8 flex justify-center relative z-10">
              {!isDemoMode ? (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-950/20 border border-green-900/30 rounded-full text-[10px] text-green-400 font-mono shadow-[0_0_10px_rgba(34,197,94,0.05)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-roxou-green animate-pulse" />
                  <Database className="w-3.5 h-3.5 text-roxou-green" />
                  <span>Conectado ao Supabase Real</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-950/20 border border-amber-900/30 rounded-full text-[10px] text-amber-400 font-mono shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Modo Demonstrativo Ativo</span>
                </div>
              )}
            </div>

            {/* Modo Demo/Fast Switch containing clear developer options */}
            {isDemoMode && (
              <div className="mt-8 pt-6 border-t border-slate-850 relative z-10">
                <div className="flex items-center gap-1.5 justify-center mb-3 text-[10px] tracking-widest uppercase text-amber-500 font-bold font-mono">
                  <span>Fast Bypass Dev-Mode</span>
                </div>
                
                <p className="text-[10px] text-slate-500 text-center mb-5 leading-normal">
                  Chaves ambientais do Supabase indisponíveis nesta Sandbox de prévia rápida. Acesse um perfil fake abaixo para testar as telas:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => handleDemoLogin('passageiro')}
                    className="bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 border border-purple-900/25 rounded-md py-3 px-4 text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-purple-400" />
                      <div className="text-left font-display">
                        <span className="font-bold text-slate-105 text-[11px]">Passageiro de Teste</span>
                      </div>
                    </div>
                    <LogIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDemoLogin('admin')}
                    className="bg-slate-900/80 hover:bg-[#12101b] text-emerald-400 border border-slate-800 rounded-md py-3 px-4 text-xs font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <div className="text-left font-display">
                        <span className="font-bold text-slate-105 text-[11px]">Motorista Executivo (Admin)</span>
                      </div>
                    </div>
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer containing genuine terms */}
            <div className="text-center mt-10 pt-5 border-t border-slate-850/40 text-[10px] text-slate-500 font-mono relative z-10 flex items-center justify-center gap-2">
              <span>Ambiente Seguro</span>
              <span>&bull;</span>
              <span>reserva.roxou.com.br</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginView;
