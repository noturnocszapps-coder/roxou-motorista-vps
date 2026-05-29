/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RideRequest } from '../types';
import { formatCurrency } from '../lib/pricing';
import { MapPin, Calendar, Users, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import { navigate } from '../lib/navigation';

interface CardProps {
  key?: string;
  ride: RideRequest;
  isAdminView?: boolean;
}

export function getRideStatusConfig(status: string) {
  const map: Record<string, { label: string; textClass: string; bgClass: string; dotClass: string }> = {
    pendente: {
      label: 'Novo Orçamento',
      textClass: 'text-yellow-400',
      bgClass: 'bg-yellow-400/5 border-yellow-400/20',
      dotClass: 'bg-yellow-400 animate-pulse',
    },
    aprovado: {
      label: 'Orçamento Aprovado',
      textClass: 'text-indigo-400',
      bgClass: 'bg-indigo-400/5 border-indigo-400/20',
      dotClass: 'bg-indigo-400',
    },
    recusado: {
      label: 'Recusado',
      textClass: 'text-rose-500',
      bgClass: 'bg-rose-500/5 border-rose-500/20',
      dotClass: 'bg-rose-500',
    },
    confirmado_pagamento: {
      label: 'Pagamento Enviado',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-400/5 border-amber-400/20',
      dotClass: 'bg-amber-450 animate-pulse',
    },
    confirmado_reserva: {
      label: 'Confirmada / Reservada',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-400/5 border-emerald-400/20 shadow-neon-green/20',
      dotClass: 'bg-emerald-400 shadow-neon-green',
    },
    em_viagem: {
      label: 'Em Viagem',
      textClass: 'text-purple-400',
      bgClass: 'bg-purple-400/5 border-purple-400/20',
      dotClass: 'bg-purple-400 animate-ping',
    },
    concluido: {
      label: 'Concluída',
      textClass: 'text-slate-400',
      bgClass: 'bg-slate-800/20 border-slate-700/30',
      dotClass: 'bg-slate-500',
    },
    cancelado: {
      label: 'Cancelada',
      textClass: 'text-slate-500',
      bgClass: 'bg-red-950/10 border-red-900/10',
      dotClass: 'bg-slate-600',
    },
  };

  return map[status] || {
    label: status,
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-800/10 border-slate-800',
    dotClass: 'bg-slate-400',
  };
}

export function RideCard({ ride, isAdminView = false }: CardProps) {
  const statusCfg = getRideStatusConfig(ride.status);
  
  // Formatar data de yyyy-mm-dd para dd/mm/yyyy
  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleCardClick = () => {
    navigate(`/reserva/${ride.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-roxou-card hover:bg-roxou-card-hover border border-slate-800/80 rounded-2xl p-5 transition-all duration-300 transform active:scale-[0.99] cursor-pointer group hover:border-roxou-purple/40"
    >
      {/* Header do Card */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-roxou-neon" />
          <p className="font-mono text-[10px] tracking-wider uppercase text-slate-500">
            Reserva #{ride.id ? ride.id.split('-')[0].toUpperCase() : 'ROXOU'}
          </p>
        </div>
        
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusCfg.bgClass} ${statusCfg.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Trajeto */}
      <div className="space-y-3 mb-4">
        {/* Origem */}
        <div className="flex gap-2.5">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[8px] text-slate-300">A</div>
            <div className="w-0.5 h-6 bg-slate-850" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Origem</span>
            <p className="text-sm font-medium text-slate-200 line-clamp-1">{ride.origin}</p>
          </div>
        </div>

        {/* Destino */}
        <div className="flex gap-2.5">
          <div className="w-4 h-4 rounded-full bg-roxou-purple/40 border border-roxou-purple flex items-center justify-center text-[8px] text-white">B</div>
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Destino</span>
            <p className="text-sm font-medium text-slate-250 line-clamp-1">{ride.destination}</p>
          </div>
        </div>
      </div>

      <hr className="border-slate-850 my-4" />

      {/* Rodapé e Parâmetros */}
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDateBr(ride.scheduled_date)} às {ride.scheduled_time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{ride.passenger_count} {ride.passenger_count === 1 ? 'passageiro' : 'passageiros'}</span>
          </div>
        </div>

        <div className="text-right flex flex-col justify-center">
          <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
            {ride.final_price ? 'Valor Fechado' : 'Valor Estimado'}
          </span>
          <p className="text-lg font-bold font-display text-roxou-purple group-hover:text-roxou-neon transition-colors">
            {formatCurrency(ride.final_price || ride.estimated_price)}
          </p>
          {ride.trip_type === 'ida_e_volta' && (
            <span className="text-[9px] text-indigo-400 bg-indigo-950/20 px-1 py-0.5 rounded border border-indigo-900/20 inline-block self-end font-semibold tracking-wide">
              Ida e Volta
            </span>
          )}
        </div>
      </div>

      {isAdminView && ride.profiles && (
        <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            {ride.profiles.avatar_url ? (
              <img
                src={ride.profiles.avatar_url}
                alt={ride.profiles.full_name || ''}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-400 uppercase">
                {ride.profiles.full_name?.charAt(0) || 'P'}
              </div>
            )}
            <span className="text-xs text-slate-450 truncate max-w-[150px]">
              {ride.profiles.full_name}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-[11px] font-semibold text-roxou-neon">
            <span>Gerenciar</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
    </div>
  );
}
export default RideCard;
