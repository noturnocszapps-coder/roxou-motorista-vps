/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, navigate } from './lib/navigation';
import { supabaseService } from './lib/supabase';
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
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Carregar e sincronizar usuário logado com logs temporários e controle robusto de carregamento
  const refreshUserData = async () => {
    console.log('[AUTH] start');
    try {
      const liveUser = await supabaseService.getCurrentUser();
      if (liveUser) {
        console.log('[AUTH] profile loaded:', liveUser.email);
        setCurrentUser(liveUser);
      } else {
        console.log('[AUTH] profile failed (null/not found)');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('[AUTH] profile failed with exception during login check:', e);
      setCurrentUser(null);
    } finally {
      console.log('[AUTH] loading finished');
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();

    // Ouvinte para reatividade de login e deslogin
    const unsubscribe = supabaseService.subscribeToAuth((user) => {
      console.log('[AUTH] session loaded from subscription event');
      if (user) {
        console.log('[AUTH] profile loaded via subscription:', user.email);
        setCurrentUser(user);
      } else {
        console.log('[AUTH] profile failed / session null via subscription');
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Proteger Rotas e Redirecionamentos se deslogado
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser && currentPath !== '/login') {
      navigate('/login');
    }
  }, [currentUser, currentPath, authLoading]);

  if (authLoading) {
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
  if (!currentUser || currentPath === '/login') {
    return (
      <div className="w-full min-h-screen bg-[#08070d] flex flex-col justify-start">
        <DemoHeader currentUser={currentUser} onRefreshUser={refreshUserData} />
        <div className="flex-grow w-full flex items-center justify-center">
          <LoginView currentUser={currentUser} onRefreshUser={refreshUserData} />
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
    currentPath === '/admin/solicitacoes' ||
    currentPath === '/admin/agenda' ||
    currentPath === '/admin/clientes' ||
    currentPath === '/admin/motoristas' ||
    currentPath === '/admin/financeiro' ||
    currentPath === '/admin/configuracoes'
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
