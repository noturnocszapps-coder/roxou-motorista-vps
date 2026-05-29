/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, TripType } from '../../types';
import { calculateRidePrice, formatCurrency } from '../../lib/pricing';
import { navigate } from '../../lib/navigation';
import { ArrowLeft, MapPin, Navigation, Calendar, Clock, Users, FileText, Sparkles, Plus, Info } from 'lucide-react';

interface CreateProps {
  currentUser: Profile;
}

export function CreateRequestView({ currentUser }: CreateProps) {
  // Inicializar data para amanhã como padrão recomendado
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [scheduledDate, setScheduledDate] = useState(getTomorrowString());
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [tripType, setTripType] = useState<TripType>('ida');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [observation, setObservation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calcular preço em tempo real
  const pricing = calculateRidePrice(Number(distanceKm) || 0, tripType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!origin.trim()) {
      setValidationError('O local de origem é obrigatório.');
      return;
    }
    if (!destination.trim()) {
      setValidationError('O local de destino é obrigatório.');
      return;
    }
    if (!scheduledDate) {
      setValidationError('Selecione uma data para o agendamento.');
      return;
    }
    if (!scheduledTime) {
      setValidationError('Defina um horário aproximado de embarque.');
      return;
    }
    if (!distanceKm || distanceKm <= 0) {
      setValidationError('Insira uma distância estimada de quilometragem maior que zero.');
      return;
    }
    if (passengerCount < 1 || passengerCount > 4) {
      setValidationError('A viagem suporta de 1 a no máximo 4 passageiros.');
      return;
    }

    setLoading(true);

    try {
      const response = await supabaseService.createRideRequest({
        user_id: currentUser.id,
        origin: origin.trim(),
        destination: destination.trim(),
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        distance_km: Number(distanceKm),
        trip_type: tripType,
        passenger_count: Number(passengerCount),
        observation: observation.trim() || null,
        estimated_price: pricing.total,
      });

      if (response) {
        // Redirecionar para o chat e acompanhamento de status da reserva recém-criada
        navigate(`/reserva/${response.id}`);
      } else {
        setValidationError('Ocorreu um erro ao enviar sua reserva para o banco de dados. Tente novamente.');
      }
    } catch (err) {
      setValidationError('Falha ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-5 pb-12">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-3 text-left">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-roxou-card border border-slate-800 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-100">Solicitar Viagem</h2>
          <p className="text-xs text-slate-400">Preencha os detalhes e estime os valores</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl text-left text-xs text-rose-400">
            {validationError}
          </div>
        )}

        {/* Trajeto */}
        <div className="bg-roxou-card border border-slate-800/80 rounded-2xl p-4 text-left space-y-3.5">
          <p className="text-[10px] tracking-wider font-semibold text-roxou-neon uppercase">Endereços do Trajeto</p>
          
          <div className="space-y-3">
            <div className="relative">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Local de Origem</label>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl px-3 py-1.5 border border-slate-800/80 focus-within:border-roxou-purple transition-all">
                <MapPin className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ex: Aeroporto de Congonhas (ou endereço)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent text-sm text-slate-200 border-none outline-none flex-1 focus:ring-0 placeholder-slate-500 h-9"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Local de Destino</label>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl px-3 py-1.5 border border-slate-800/80 focus-within:border-roxou-purple transition-all">
                <Navigation className="w-4 h-4 text-slate-505 text-roxou-neon" />
                <input
                  type="text"
                  placeholder="Ex: Hotel Fasano, Jardins, SP"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-transparent text-sm text-slate-250 border-none outline-none flex-1 focus:ring-0 placeholder-slate-500 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Agendamento */}
        <div className="bg-roxou-card border border-slate-800/80 rounded-2xl p-4 text-left space-y-3.5">
          <p className="text-[10px] tracking-wider font-semibold text-roxou-neon uppercase">Agendamento de Embarque</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Data</label>
              <div className="flex items-center gap-2 bg-slate-900/45 rounded-xl px-3 py-2.5 border border-slate-800/80">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 border-none outline-none w-full font-sans cursor-pointer focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Horário Previsto</label>
              <div className="flex items-center gap-2 bg-slate-900/40 rounded-xl px-3 py-2.5 border border-slate-800/80">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 border-none outline-none w-full font-sans cursor-pointer focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Parâmetros do Trajeto */}
        <div className="bg-roxou-card border border-slate-800/80 rounded-2xl p-4 text-left space-y-3.5">
          <p className="text-[10px] tracking-wider font-semibold text-roxou-neon uppercase">Parâmetros da Corrida</p>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Distância Estimada (Km)</label>
              <span className="font-mono text-xs font-bold text-roxou-neon">{distanceKm} Km</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-3 py-1.5 border border-slate-800/80 focus-within:border-roxou-purple transition-all">
              <input
                type="number"
                min="1"
                max="500"
                value={distanceKm || ''}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="bg-transparent text-sm text-slate-200 border-none outline-none flex-1 focus:ring-0 h-9"
              />
              <span className="text-xs text-slate-500 font-mono">Quilômetros</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Insira os quilômetros retornados pelo Maps/Waze para estimar preço real.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Tipo de Trajeto</label>
              <div className="relative">
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
                >
                  <option value="ida" className="bg-[#12101b]">Apenas ida</option>
                  <option value="ida_e_volta" className="bg-[#12101b]">Ida e volta (2x km)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Passageiros</label>
              <div className="relative">
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
                >
                  <option value={1} className="bg-[#12101b]">1 Passageiro</option>
                  <option value={2} className="bg-[#12101b]">2 Passageiros</option>
                  <option value={3} className="bg-[#12101b]">3 Passageiros</option>
                  <option value={4} className="bg-[#12101b]">4 Passageiros (Lim.)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campo observação */}
          <div className="pt-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Observações / Preferências</label>
            <div className="flex items-start gap-2 bg-slate-900/40 rounded-xl px-3 py-2 border border-slate-800/80 focus-within:border-roxou-purple transition-all">
              <FileText className="w-4 h-4 text-slate-500 mt-1 shrink-0" />
              <textarea
                rows={2}
                placeholder="Ex: Bagagens extras, necessidade de cadeirinha ou paradas."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="bg-transparent text-sm text-slate-200 border-none outline-none flex-1 focus:ring-0 placeholder-slate-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Resumo do Orçamento Estimado */}
        <div className="bg-[#100b21] hover:bg-[#130d29] border border-roxou-purple/30 rounded-2xl p-4 text-left shadow-lg">
          <div className="flex items-center gap-1.5 mb-3 text-roxou-neon">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="font-display font-semibold text-xs uppercase tracking-wide">Orçamento Estimado</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Distância calculada:</span>
              <span className="font-mono text-slate-100">
                {pricing.distance} Km {tripType === 'ida_e_volta' ? '(dobrada)' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tarifa por Km (R$ 2,50):</span>
              <span className="font-mono text-slate-100">{formatCurrency(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Agendamento:</span>
              <span className="font-mono text-slate-100">{formatCurrency(pricing.fee)}</span>
            </div>

            {pricing.isMinimumApplied && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/5 px-2 py-1 rounded border border-amber-900/10 mt-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>Aplicada Tarifa Mínima de Viagem (R$ 30,00)</span>
              </div>
            )}

            <hr className="border-purple-950 my-2" />

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-250">Valor Estimado Total:</span>
              <span className="text-xl font-extrabold font-display text-roxou-neon animate-pulse">
                {formatCurrency(pricing.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão Enviar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-roxou-purple hover:bg-roxou-neon disabled:bg-slate-800 text-white font-display font-black text-sm tracking-wide uppercase py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-neon-purple/20 shadow-lg active:scale-95 transition-all"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 text-white font-bold" />
              <span>Solicitar Reserva</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
export default CreateRequestView;
