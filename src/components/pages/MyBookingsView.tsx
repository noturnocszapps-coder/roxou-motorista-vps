/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, RideRequest } from '../../types';
import { RideCard } from '../RideCard';
import { navigate } from '../../lib/navigation';
import { ArrowLeft, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface BookingsProps {
  currentUser: Profile;
}

type TabType = 'todas' | 'ativas' | 'historico';

export function MyBookingsView({ currentUser }: BookingsProps) {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('todas');

  useEffect(() => {
    let active = true;

    async function loadRides() {
      setLoading(true);
      const data = await supabaseService.getRideRequests('passageiro', currentUser.id);
      if (active) {
        setRides(data);
        setLoading(false);
      }
    }

    loadRides();

    // Ouvir atualizações reativas do Supabase / Simulador
    const unsubscribe = supabaseService.subscribeToAllRides(() => {
      loadRides();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentUser.id]);

  const activeStatuses = ['pendente', 'aprovado', 'confirmado_pagamento', 'confirmado_reserva', 'em_viagem'];
  const historyStatuses = ['concluido', 'cancelado', 'recusado'];

  const filteredRides = rides.filter(ride => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'ativas') return activeStatuses.includes(ride.status);
    if (activeTab === 'historico') return historyStatuses.includes(ride.status);
    return true;
  });

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-5 pb-12">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-3 text-left">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-roxou-card border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-100">Minhas Reservas</h2>
          <p className="text-xs text-slate-400">Gerencie e consulte suas viagens executivas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-roxou-card p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => setActiveTab('todas')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === 'todas' ? 'bg-roxou-purple text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todas ({rides.length})
        </button>
        <button
          onClick={() => setActiveTab('ativas')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === 'ativas' ? 'bg-roxou-purple text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ativas ({rides.filter(r => activeStatuses.includes(r.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === 'historico' ? 'bg-roxou-purple text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Concluídas ({rides.filter(r => historyStatuses.includes(r.status)).length})
        </button>
      </div>

      {/* Conteúdo da Lista */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-44 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-roxou-purple" />
            <p className="text-xs">Buscando viagens...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="bg-roxou-card border border-slate-850 p-8 rounded-2xl text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-lg text-slate-500">
              📁
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-300">Nenhum registro encontrado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
                Não localizamos nenhuma viagem nesta categoria no seu perfil.
              </p>
            </div>
          </div>
        ) : (
          filteredRides.map(ride => (
            <RideCard key={ride.id} ride={ride} />
          ))
        )}
      </div>
    </div>
  );
}
export default MyBookingsView;
