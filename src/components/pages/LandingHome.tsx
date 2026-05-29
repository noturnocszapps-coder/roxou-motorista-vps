/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, DriverStatus, RideRequest } from '../../types';
import { DriverStatusWidget } from '../DriverStatusWidget';
import { RideCard } from '../RideCard';
import { navigate } from '../../lib/navigation';
import { Sparkles, Route, BookOpen, Clock, ChevronRight, LogOut, Loader, User } from 'lucide-react';

interface HomeProps {
  currentUser: Profile;
  onRefreshUser: () => void;
}

export function LandingHome({ currentUser, onRefreshUser }: HomeProps) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [latestRides, setLatestRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Carregar status do motorista e últimas corridas
    async function initPage() {
      setLoading(true);
      try {
        const status = await supabaseService.getDriverStatus();
        if (active) setDriverStatus(status);

        const rides = await supabaseService.getRideRequests('passageiro', currentUser.id);
        if (active) setLatestRides(rides.slice(0, 3)); // Mostrar apenas as 3 mais recentes no painel inicial
      } catch (e) {
        console.error('Erro ao inicializar página inicial', e);
      } finally {
        if (active) setLoading(false);
      }
    }

    initPage();

    // Inscrição reativa para alterações de status do motorista
    const unsubscribeStatus = supabaseService.subscribeToDriverStatus((status) => {
      if (active) setDriverStatus(status);
    });

    // Inscrição reativa para alterações de solicitações
    const unsubscribeRides = supabaseService.subscribeToAllRides(async () => {
      const rides = await supabaseService.getRideRequests('passageiro', currentUser.id);
      if (active) setLatestRides(rides.slice(0, 3));
    });

    return () => {
      active = false;
      unsubscribeStatus();
      unsubscribeRides();
    };
  }, [currentUser.id]);

  const handleSignOut = async () => {
    await supabaseService.signOut();
    onRefreshUser();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-6 md:py-8 page-transition space-y-6">
      {/* Header do Usuário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-left">
          {currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name || ''}
              className="w-11 h-11 rounded-full object-cover border border-roxou-purple/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-roxou-card border border-slate-800 flex items-center justify-center text-roxou-neon font-display font-bold uppercase">
              {currentUser.full_name?.charAt(0) || 'P'}
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Olá, bem-vindo(a) 👋</p>
            <h2 className="font-display font-bold text-base text-slate-100 truncate max-w-[180px]">
              {currentUser.full_name?.split(' ')[0] || 'Passageiro'}
            </h2>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="p-2.5 rounded-xl bg-roxou-card hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Sair da conta"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Widget do Status do Motorista */}
      {driverStatus ? (
        <DriverStatusWidget status={driverStatus.status} />
      ) : (
        <div className="h-16 rounded-xl bg-roxou-card/50 border border-slate-800 animate-pulse flex items-center px-4">
          <div className="w-8 h-8 rounded-full bg-slate-900 animate-pulse" />
          <div className="ml-3 space-y-2 flex-1">
            <div className="h-3 w-1/3 bg-slate-900 rounded" />
            <div className="h-2 w-1/2 bg-slate-900 rounded" />
          </div>
        </div>
      )}

      {/* Botões Grandes de Ações */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/solicitar')}
          className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-roxou-card to-[#160d2b] hover:to-[#1e0f3c] border border-roxou-purple/20 rounded-2xl text-center group transition-all duration-300 shadow-neon-purple/5 hover:border-roxou-purple/50 cursor-pointer active:scale-95"
        >
          <div className="w-11 h-11 rounded-xl bg-roxou-purple/20 flex items-center justify-center mb-3 text-roxou-neon group-hover:scale-110 transition-transform">
            <Route className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-sm text-slate-100">Solicitar Orçamento</span>
          <span className="text-[10px] text-purple-400 mt-1">Cálculo em tempo real</span>
        </button>

        <button
          onClick={() => navigate('/minhas-reservas')}
          className="flex flex-col items-center justify-center p-5 bg-roxou-card hover:bg-[#151324] border border-slate-800/80 rounded-2xl text-center group transition-all duration-250 hover:border-slate-700/60 cursor-pointer active:scale-95"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-3 text-slate-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-sm text-slate-100">Minhas Reservas</span>
          <span className="text-[10px] text-slate-400 mt-1">Consultar histórico</span>
        </button>
      </div>

      {/* Lista de últimas solicitações */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center text-left">
          <div className="flex items-center gap-1.5 font-display font-bold text-sm text-slate-200">
            <Clock className="w-4 h-4 text-roxou-purple" />
            <span>Últimas Reservas</span>
          </div>
          <button
            onClick={() => navigate('/minhas-reservas')}
            className="text-xs text-roxou-neon font-semibold flex items-center gap-0.5 hover:text-white transition-colors"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-roxou-card/50 border border-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : latestRides.length === 0 ? (
          <div className="bg-roxou-card border border-slate-850/60 rounded-2xl p-6 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-lg text-slate-600">
              🧳
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-sm">Nenhuma reserva agendada</p>
              <p className="text-xs text-slate-500 mt-1">
                Suas solicitações de viagem confirmadas ou pendentes aparecerão listadas aqui para acompanhamento simples.
              </p>
            </div>
            <button
              onClick={() => navigate('/solicitar')}
              className="mt-2 bg-roxou-purple/20 hover:bg-roxou-purple/30 text-roxou-neon border border-roxou-purple/30 text-xs font-semibold px-4 py-2 rounded-xl transition-all inline-block cursor-pointer active:scale-95"
            >
              Fazer Primeira Reserva
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-1.5">
            {latestRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-4 text-center">
        <p className="text-[10px] text-slate-500 font-mono tracking-wider">
          RESERVA ROXOU • EXCLUSIVIDADE &amp; CONFIANÇA
        </p>
      </div>
    </div>
  );
}
export default LandingHome;
