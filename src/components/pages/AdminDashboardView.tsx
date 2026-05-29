/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, DriverStatus, DriverStatusType, RideRequest } from '../../types';
import { RideCard } from '../RideCard';
import { navigate } from '../../lib/navigation';
import {
  Shield,
  Circle,
  Clock,
  Car,
  TrendingUp,
  Sliders,
  Calendar,
  Settings,
  Grid,
  Loader2,
  Users
} from 'lucide-react';

interface AdminProps {
  currentUser: Profile;
  onRefreshUser: () => void;
}

export function AdminDashboardView({ currentUser, onRefreshUser }: AdminProps) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const status = await supabaseService.getDriverStatus();
      setDriverStatus(status);

      const allRides = await supabaseService.getRideRequests('admin', currentUser.id);
      setRides(allRides);
    } catch (e) {
      console.error('Erro ao buscar dados no painel admin', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    loadData();

    // Inscrição reativa para alterações de solicitações
    const unsubscribeRides = supabaseService.subscribeToAllRides(() => {
      loadData();
    });

    return () => {
      active = false;
      unsubscribeRides();
    };
  }, [currentUser.id]);

  const handleChangeStatus = async (newStatus: DriverStatusType) => {
    setUpdatingStatus(true);
    try {
      const success = await supabaseService.updateDriverStatus(newStatus, currentUser.id);
      if (success) {
        setDriverStatus(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtrar solicitações pendentes e de pagamento (ações imediatas necessárias)
  const pendingRequests = rides.filter(r => r.status === 'pendente' || r.status === 'confirmado_pagamento');
  
  // Estatísticas do motorista
  const pendingCount = rides.filter(r => r.status === 'pendente').length;
  const paymentAwaitingCount = rides.filter(r => r.status === 'confirmado_pagamento').length;
  const activeTripsCount = rides.filter(r => r.status === 'em_viagem' || r.status === 'confirmado_reserva').length;
  const concludedTrips = rides.filter(r => r.status === 'concluido');
  
  // Calcular lucros estimados concluídos
  const totalConcludedEarnings = concludedTrips.reduce((acc, r) => acc + (r.final_price || r.estimated_price), 0);

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-6 pb-12">
      {/* Header do Admin */}
      <div className="flex justify-between items-center text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-roxou-purple/20 flex items-center justify-center text-roxou-neon">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-100">Painel do Motorista</h2>
            <p className="text-[10px] text-slate-400 font-medium">CONTA: {currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs bg-roxou-card border border-slate-800 hover:bg-slate-900 rounded-xl px-3 py-1.5 text-slate-400 font-semibold cursor-pointer"
        >
          Visão Cliente
        </button>
      </div>

      {/* Navegação Admin */}
      <div className="grid grid-cols-3 gap-2.5 bg-roxou-card/80 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => navigate('/admin')}
          className="bg-roxou-purple/20 border border-roxou-purple/30 text-roxou-neon rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Grid className="w-4 h-4" />
          <span>Solicitações</span>
        </button>
        <button
          onClick={() => navigate('/admin/agenda')}
          className="hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => navigate('/admin/configuracoes')}
          className="hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Alterar Status de Disponibilidade */}
      <div className="bg-roxou-card border border-slate-800 rounded-2xl p-4 text-left space-y-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Definir Disponibilidade</span>
          <p className="text-xs text-slate-400 mt-1">Isso atualiza o status em tempo real para os passageiros.</p>
        </div>

        {/* Status Botões Neon */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleChangeStatus('online')}
            disabled={updatingStatus}
            className={`py-2 px-1.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
              driverStatus?.status === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-neon-green/20'
                : 'bg-slate-900/30 border-slate-850/60 text-slate-500 hover:text-slate-350 hover:border-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${driverStatus?.status === 'online' ? 'bg-emerald-400 shadow-neon-green animate-pulse' : 'bg-slate-600'}`} />
            <span>Online</span>
          </button>

          <button
            onClick={() => handleChangeStatus('ocupado')}
            disabled={updatingStatus}
            className={`py-2 px-1.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
              driverStatus?.status === 'ocupado'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900/30 border-slate-850/60 text-slate-500 hover:text-slate-350 hover:border-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${driverStatus?.status === 'ocupado' ? 'bg-amber-400 shadow-pulse' : 'bg-slate-600'}`} />
            <span>Ocupado</span>
          </button>

          <button
            onClick={() => handleChangeStatus('offline')}
            disabled={updatingStatus}
            className={`py-2 px-1.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
              driverStatus?.status === 'offline'
                ? 'bg-slate-800/40 border-slate-700 text-slate-300'
                : 'bg-slate-900/30 border-slate-850/60 text-slate-500 hover:text-slate-350 hover:border-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${driverStatus?.status === 'offline' ? 'bg-slate-400' : 'bg-slate-600'}`} />
            <span>Offline</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Ganhos Gerais</span>
            <TrendingUp className="w-3.5 h-3.5 text-roxou-neon" />
          </div>
          <p className="text-lg font-bold font-display text-slate-100 mt-2 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalConcludedEarnings)}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">{concludedTrips.length} viagens finalizadas</span>
        </div>

        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Status Ativos</span>
            <Car className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </div>
          <p className="text-lg font-bold font-display text-slate-100 mt-2">{activeTripsCount}</p>
          <span className="text-[9px] text-purple-400 font-medium">agendadas ou em voo</span>
        </div>
      </div>

      {/* Lista de Ações Requeridas */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-left">
          <div className="flex items-center gap-1.5 font-display font-bold text-sm text-slate-205">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Ações Urgentes ({pendingRequests.length})</span>
          </div>
          {pendingCount > 0 && (
            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 font-bold px-2 py-0.5 rounded-full">
              {pendingCount} Pendentes
            </span>
          )}
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-roxou-purple" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="bg-roxou-card border border-slate-850 p-6 rounded-2xl text-center space-y-2 text-slate-400">
            <div className="text-xl">🏆</div>
            <p className="font-bold text-slate-300 text-xs">Sem pendências para análise!</p>
            <p className="text-[10px] text-slate-500 max-w-[210px] mx-auto leading-normal">
              Todas os orçamentos foram respondidos ou confirmados. Verifique a Agenda para as próximas saídas.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {pendingRequests.map(ride => (
              <RideCard key={ride.id} ride={ride} isAdminView={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminDashboardView;
