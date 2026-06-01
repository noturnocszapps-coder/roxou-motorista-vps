/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useLocation, navigate } from './lib/navigation';
import { supabaseService, isDemoMode, supabase } from './lib/supabase';
import { Profile } from './types';
import { DemoHeader } from './components/DemoHeader';

// Importando as Páginas Estaticamente (Home e Login permanecem síncronos por serem pontos de entrada/críticos do usuário)
import { LoginView } from './components/pages/LoginView';
import { LandingHome } from './components/pages/LandingHome';

// Lazy loading das demais Páginas para otimizar o Bundle principal (Performance Hardening)
const CreateRequestView = lazy(() => import('./components/pages/CreateRequestView'));
const MyBookingsView = lazy(() => import('./components/pages/MyBookingsView'));
const BookingDetailsView = lazy(() => import('./components/pages/BookingDetailsView'));
const AdminDashboardView = lazy(() => import('./components/pages/AdminDashboardView'));

import { ShieldAlert, Car, Loader } from 'lucide-react';

export default function App() {
  const { currentPath, matchRoute } = useLocation();
  const [authUser, setAuthUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const wasAuthenticated = useRef(false);

  // Computa o usuário atual considerando o profile real ou o fallback seguro feito em useMemo
  const currentUser = useMemo(() => {
    if (profile) return profile;
    if (authUser) {
      console.log('[AUTH] profile failed, using fallback');
      const fallbackRole = authUser.email === 'contato.fh3@gmail.com' ? 'admin' : 'passageiro';
      return {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Passageiro',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: fallbackRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;
    }
    return null;
  }, [profile, authUser]);

  const user = currentUser;

  // Carregar e sincronizar usuário logado com logs temporários e controle robusto de carregamento
  const refreshUserData = async () => {
    console.log('[AUTH] start');
    
    // Modo local / demonstração
    if (isDemoMode) {
      try {
        const liveUser = await supabaseService.getCurrentUser();
        if (liveUser) {
          console.log('[AUTH] profile loaded:', liveUser.email);
          setProfile(liveUser);
          setAuthUser(liveUser);
          wasAuthenticated.current = true;
        } else {
          console.log('[AUTH] profile failed (null/not found)');
        }
      } catch (err) {
        console.error('[AUTH] demo user load error:', err);
      } finally {
        setLoadingAuth(false);
      }
      return;
    }

    // Modo real do Supabase
    try {
      if (!supabase) {
        console.warn('[AUTH] supabase client not initialized');
        setLoadingAuth(false);
        return;
      }

      const { data: { user: sUser }, error: userError } = await supabase.auth.getUser();
      if (sUser) {
        console.log('[AUTH] auth user valid, keeping session');
        setAuthUser(sUser);
        wasAuthenticated.current = true;

        // Tentar buscar perfil correspondente no banco
        try {
          const liveUser = await supabaseService.getCurrentUser();
          if (liveUser) {
            console.log('[AUTH] profile loaded:', liveUser.email);
            setProfile(liveUser);
          } else {
            console.warn('[AUTH] profile failed, using fallback');
          }
        } catch (profileErr) {
          console.warn('[AUTH] erro ao recuperar o perfil do usuário (warning):', profileErr);
          console.warn('[AUTH] profile failed, using fallback');
        }
      } else {
        console.log('[AUTH] session null, no auth user');
        setAuthUser(null);
        setProfile(null);
      }
    } catch (e) {
      console.error('[AUTH] profile failed with exception during login check:', e);
    } finally {
      console.log('[AUTH] loading finished');
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    // Ouvinte único para reatividade de login e deslogin
    // Evita chamadas de carregamento iniciais duplicadas, mantendo a reatividade
    const unsubscribe = supabaseService.subscribeToAuth((loadedAuthUser, loadedProfile, event) => {
      console.log('[AUTH] session loaded from subscription event:', event);
      if (loadedAuthUser) {
        console.log('[AUTH] auth user valid, keeping session');
        setAuthUser(loadedAuthUser);
        wasAuthenticated.current = true;
        if (loadedProfile) {
          setProfile(loadedProfile);
        } else {
          console.warn('[AUTH] profile failed, using fallback');
        }
      } else {
        if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          if (wasAuthenticated.current || event === 'SIGNED_OUT') {
            console.error('[AUTH REDIRECT]', `Sessão inválida ou deslogada no evento ${event}.`);
          } else {
            console.warn('[AUTH INFO]', `Sem sessão ativa inicialmente no evento ${event}.`);
          }
          setAuthUser(null);
          setProfile(null);
        }
      }
      setLoadingAuth(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Proteger Rotas e Redirecionamentos se deslogado (apenas se authUser realmente não existir!)
  useEffect(() => {
    if (loadingAuth) return;
    
    if (loadingAuth === false && !authUser && currentPath !== '/login') {
      if (wasAuthenticated.current) {
        console.error('[AUTH REDIRECT]', `Usuário não autenticado (no authUser) tentando acessar ${currentPath}. Forçando /login`);
      } else {
        console.warn('[AUTH INFO]', `Acesso inicial à rota protegida ${currentPath} sem sessão ativa. Redirecionando para /login`);
      }
      navigate('/login');
    }
  }, [authUser, currentPath, loadingAuth]);

  // Redirecionamento de compatibilidade para rotas de veículos administrativa
  useEffect(() => {
    if (currentPath === '/admin/motoristas') {
      console.log('[COMPATIBILITY REDIRECT]', 'Redirecionando /admin/motoristas para /admin/veiculo');
      navigate('/admin/veiculo');
    }
  }, [currentPath]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#07060b] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-12 h-12 bg-[#12101b] border border-roxou-purple/30 rounded-2xl flex items-center justify-center shadow-neon-purple/20">
          <Car className="w-6 h-6 text-roxou-neon animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Loader className="w-3.5 h-3.5 text-roxou-purple animate-spin" />
          <span>Verificando autenticação segura...</span>
        </div>
      </div>
    );
  }

  // Se o usuário tentar acessar qualquer rota deslogado, forçar exibição do login
  if (!authUser || currentPath === '/login') {
    return (
      <div className="w-full min-h-screen bg-[#08070d] flex flex-col justify-start">
        <DemoHeader currentUser={user} onRefreshUser={refreshUserData} />
        <div className="flex-grow w-full flex items-center justify-center">
          <LoginView currentUser={user} onRefreshUser={refreshUserData} />
        </div>
      </div>
    );
  }

  // ==========================================
  // DISPATCHER DE ROTAS
  // ==========================================
  let pageContent = null;

  // Analisar rota de detalhe de reserva (/reserva/:id)
  const detailMatch = matchRoute('/reserva/:id');

  if (currentPath === '/login') {
    pageContent = <LoginView currentUser={currentUser} onRefreshUser={refreshUserData} />;
  } else if (currentPath === '/') {
    // Se o usuário logado for Admin, redireciona o fluxo inicial para o painel Admin
    if (currentUser.role === 'admin') {
      pageContent = <AdminDashboardView currentUser={currentUser} onRefreshUser={refreshUserData} />;
    } else {
      pageContent = <LandingHome currentUser={currentUser} onRefreshUser={refreshUserData} />;
    }
  } else if (currentPath === '/solicitar') {
    pageContent = <CreateRequestView currentUser={currentUser} />;
  } else if (currentPath === '/minhas-reservas') {
    pageContent = <MyBookingsView currentUser={currentUser} />;
  } else if (detailMatch.matches) {
    const { id } = detailMatch.params;
    pageContent = <BookingDetailsView rideId={id} currentUser={currentUser} />;
  } else if (
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/')
  ) {
    if (currentUser.role === 'admin') {
      pageContent = <AdminDashboardView currentUser={currentUser} onRefreshUser={refreshUserData} />;
    } else {
      pageContent = <AccessDeniedScreen />;
    }
  } else {
    // 404 - Rota Inexistente redireciona
    pageContent = (
      <div className="p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto" />
        <h3 className="font-display font-bold text-lg text-slate-100">Caminho Desconhecido</h3>
        <p className="text-xs text-slate-400">A rota solicitada não existe ou foi movida.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-roxou-purple text-white px-5 py-2.5 rounded-xl font-semibold text-xs cursor-pointer"
        >
          Ir para Página Inicial
        </button>
      </div>
    );
  }

  const isAdminPath = currentUser?.role === 'admin' && (
    currentPath === '/' ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/reserva')
  );

  if (isAdminPath) {
    return (
      <div className="w-full min-h-screen bg-[#07070a] text-[#f3f4f6] relative font-sans antialiased overflow-x-hidden flex flex-col justify-start">
        {/* Header reativo para ambiente de demonstração */}
        <DemoHeader currentUser={currentUser} onRefreshUser={refreshUserData} />
        
        {/* Renderização da Página Atual no formato full-width para SaaS */}
        <div className="flex-grow w-full flex flex-col">
          <Suspense fallback={
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader className="w-6 h-6 text-roxou-purple animate-spin" />
              <span className="text-[11px] font-medium text-slate-500">Conectando ao painel executivo...</span>
            </div>
          }>
            {pageContent}
          </Suspense>
        </div>
      </div>
    );
  }

  // Se não for admin, exibe a interface dentro do mockup celular para o Passageiro
  return (
    <div className="w-full min-h-screen bg-[#08070d] flex items-center justify-center">
      {/* Contêiner Estilo Celular Centralizado no Desktop */}
      <div className="w-full max-w-sm bg-roxou-bg min-h-screen md:min-h-[92vh] md:my-4 md:rounded-[32px] md:border md:border-slate-850 md:shadow-2xl overflow-hidden flex flex-col justify-start relative">
        {/* Header reativo para ambiente de demonstração */}
        <DemoHeader currentUser={currentUser} onRefreshUser={refreshUserData} />
        
        {/* Renderização da Página Atual com transição padrão */}
        <div className="flex-1 overflow-y-auto page-transition">
          <Suspense fallback={
            <div className="h-[40vh] flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader className="w-6 h-6 text-roxou-purple animate-spin" />
              <span className="text-[11px] font-medium text-slate-500">Conectando ao canal seguro...</span>
            </div>
          }>
            {pageContent}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedScreen() {
  return (
    <div className="p-8 text-center space-y-4 flex flex-col justify-center min-h-[60vh]">
      <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto shadow-neon-red/10 animate-bounce" />
      <h3 className="font-display font-bold text-lg text-slate-200">Acesso Restrito</h3>
      <p className="text-xs text-slate-450 leading-relaxed max-w-[240px] mx-auto">
        Seu perfil de passageiro não possui privilégios de administrador para visualizar o painel executivo privado.
      </p>
      <button
        onClick={() => navigate('/')}
        className="bg-slate-900 border border-slate-800 text-slate-200 px-5 py-2.5 rounded-xl font-semibold text-xs self-center cursor-pointer active:scale-95"
      >
        Voltar para Home
      </button>
    </div>
  );
}
