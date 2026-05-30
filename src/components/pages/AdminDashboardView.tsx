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

  // Obter o mês atual e ano para cálculo da receita mensal
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthName = monthNames[now.getMonth()];

  // Filtrar viagens concluídas no mês atual
  const monthlyConcludedTrips = concludedTrips.filter(r => {
    return r.scheduled_date && r.scheduled_date.startsWith(currentMonthKey);
  });
  const totalMonthlyEarnings = monthlyConcludedTrips.reduce((acc, r) => acc + (r.final_price || r.estimated_price), 0);

  // Ticket médio de viagens concluídas
  const averageTicket = concludedTrips.length > 0 
    ? totalConcludedEarnings / concludedTrips.length 
    : 0;

  // Filtrar as principais reservas de mais alto valor (excluindo as canceladas) de forma decrescente
  const highValueBookings = [...rides]
    .filter(r => r.status !== 'cancelado' && r.status !== 'recusado')
    .sort((a, b) => {
      const valA = a.final_price || a.estimated_price || 0;
      const valB = b.final_price || b.estimated_price || 0;
      return valB - valA;
    })
    .slice(0, 4);

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
          className="text-xs bg-roxou-card border border-slate-880 hover:bg-slate-900 rounded-xl px-3 py-1.5 text-slate-400 font-semibold cursor-pointer"
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

      {/* Cards de Métricas de Finanças e Atividade */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Ganhos Gerais</span>
            <TrendingUp className="w-3.5 h-3.5 text-roxou-neon" />
          </div>
          <p className="text-base font-bold font-display text-slate-100 mt-2 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalConcludedEarnings)}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">{concludedTrips.length} viagens finalizadas</span>
        </div>

        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Receita {currentMonthName}</span>
            <span className="text-roxou-neon font-bold text-[10px]">&bull; {monthlyConcludedTrips.length}</span>
          </div>
          <p className="text-base font-bold font-display text-slate-100 mt-2 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyEarnings)}
          </p>
          <span className="text-[9px] text-emerald-400 font-medium">Rec. Mensal Concluída</span>
        </div>

        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Status Ativos</span>
            <Car className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          </div>
          <p className="text-base font-bold font-display text-slate-100 mt-2">{activeTripsCount}</p>
          <span className="text-[9px] text-purple-400 font-medium">Em andamento ou confirmadas</span>
        </div>

        <div className="bg-roxou-card border border-slate-850/60 p-4 rounded-xl text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Ticket Médio</span>
            <span className="text-[9px] font-mono font-bold text-amber-500">R$</span>
          </div>
          <p className="text-base font-bold font-display text-slate-100 mt-2 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)}
          </p>
          <span className="text-[9px] text-slate-500 font-medium">Média p/ viagem concluída</span>
        </div>
      </div>

      {/* Reservas de Alto Valor */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 font-display font-bold text-sm text-slate-205 text-left">
          <span className="text-amber-500">💎</span>
          <span>Reservas de Destaque (Alto Valor)</span>
        </div>

        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-roxou-purple" />
          </div>
        ) : highValueBookings.length === 0 ? (
          <div className="bg-roxou-card border border-slate-850 p-6 rounded-2xl text-center text-slate-500 text-[11px] leading-normal">
            Nenhuma reserva relevante cadastrada ainda.
          </div>
        ) : (
          <div className="space-y-2.5">
            {highValueBookings.map(ride => {
              const price = ride.final_price || ride.estimated_price;
              const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
              
              const formatDateShort = (dateStr: string) => {
                if (!dateStr) return '';
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  return `${parts[2]}/${parts[1]}`;
                }
                return dateStr;
              };

              // Mapeamento menor de status
              let statusText = 'Novo Orç.';
              let statusColor = 'text-yellow-405 border-yellow-500/10 bg-yellow-500/5';
              if (ride.status === 'concluido') {
                statusText = 'Concluída';
                statusColor = 'text-slate-400 border-slate-800 bg-slate-850/50';
              } else if (ride.status === 'confirmado_reserva') {
                statusText = 'Reservada';
                statusColor = 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5';
              } else if (ride.status === 'em_viagem') {
                statusText = 'Em Viagem';
                statusColor = 'text-purple-400 border-purple-500/10 bg-purple-500/5';
              } else if (ride.status === 'aprovado' || ride.status === 'confirmado_pagamento') {
                statusText = 'Orç. Aprov.';
                statusColor = 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5';
              }

              return (
                <div
                  key={ride.id}
                  onClick={() => navigate(`/reserva/${ride.id}`)}
                  className="bg-roxou-card group hover:bg-roxou-card-hover border border-slate-850 hover:border-slate-800 p-3.5 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer text-left"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-slate-500 tracking-wide uppercase">
                        #{ride.id.split('-')[0].toUpperCase()}
                      </span>
                      <span className="text-[9px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                        {formatDateShort(ride.scheduled_date)} {ride.scheduled_time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-205 font-medium truncate mt-1">
                      {ride.origin.split(',')[0]} &rarr; {ride.destination.split(',')[0]}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="font-display font-black text-xs text-roxou-neon">
                      {formattedPrice}
                    </span>
                    <span className={`text-[8px] font-bold ${statusColor} px-1.5 py-0.5 rounded border`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
