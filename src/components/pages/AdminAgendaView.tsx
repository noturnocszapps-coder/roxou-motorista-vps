/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, RideRequest } from '../../types';
import { RideCard } from '../RideCard';
import { navigate } from '../../lib/navigation';
import { Shield, Calendar, Grid, Settings, ListCollapse, Loader2, ArrowRight } from 'lucide-react';

interface AgendaProps {
  currentUser: Profile;
}

export function AdminAgendaView({ currentUser }: AgendaProps) {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAgendaData() {
    setLoading(true);
    try {
      const allRides = await supabaseService.getRideRequests('admin', currentUser.id);
      
      // Filtrar apenas viagens confirmadas ou em andamento
      const activeAgendas = allRides.filter(r => 
        r.status === 'confirmado_reserva' || r.status === 'em_viagem'
      );
      
      // Ordenar por data e hora (ascendente, mais próximo primeiro)
      const sorted = activeAgendas.sort((a, b) => {
        const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date);
        if (dateCompare !== 0) return dateCompare;
        return a.scheduled_time.localeCompare(b.scheduled_time);
      });

      setRides(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    loadAgendaData();

    const unsubscribe = supabaseService.subscribeToAllRides(() => {
      loadAgendaData();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [currentUser.id]);

  // Formatar data em português amigável
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dummyDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const weekday = dummyDate.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayMonth = `${parts[2]}/${parts[1]}`;
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} - ${dayMonth}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-6 pb-12">
      {/* Header do Admin */}
      <div className="flex justify-between items-center text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-roxou-purple/20 flex items-center justify-center text-roxou-neon">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-100">Agenda Executiva</h2>
            <p className="text-[10px] text-slate-400 font-medium">Reservas confirmadas em ordem</p>
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
          className="hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Grid className="w-4 h-4" />
          <span>Solicitações</span>
        </button>
        <button
          onClick={() => navigate('/admin/agenda')}
          className="bg-roxou-purple/20 border border-roxou-purple/30 text-roxou-neon rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
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

      {/* Listagem de Viagens da Agenda */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-roxou-purple" />
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-roxou-card border border-slate-850 p-8 rounded-2xl text-center text-slate-400 space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="font-semibold text-xs text-slate-300">Nenhum compromisso confirmado</p>
              <p className="text-[10px] text-slate-505 leading-relaxed mt-1 max-w-[210px] mx-auto">
                Novas viagens confirmadas com pagamento PIX serão agendadas nesta área.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="bg-slate-900 border border-slate-850 hover:bg-slate-850 text-xs px-4 py-2 rounded-xl text-slate-300 mt-2 font-bold cursor-pointer"
            >
              Analisar Pendências
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            {/* Agrupamento simples visual por datas se forem múltiplas */}
            {rides.map((ride, index) => {
              // Mostrar uma linha de data divisória de cabeçalho
              const showDateHeader = index === 0 || rides[index - 1].scheduled_date !== ride.scheduled_date;
              
              return (
                <div key={ride.id} className="space-y-2">
                  {showDateHeader && (
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <span className="w-2 h-2 rounded-full bg-roxou-neon shadow-neon-purple/40" />
                      <span className="font-display font-extrabold text-xs uppercase tracking-wide text-roxou-neon">
                        {formatFriendlyDate(ride.scheduled_date)}
                      </span>
                      <div className="flex-1 h-[1px] bg-slate-850" />
                    </div>
                  )}

                  <RideCard ride={ride} isAdminView={true} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminAgendaView;
