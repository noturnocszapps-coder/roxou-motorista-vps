/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, TripType, Driver, DriverSettings } from '../../types';
import { calculateRideEstimate, formatCurrency } from '../../lib/pricing';
import { navigate } from '../../lib/navigation';
import { ArrowLeft, MapPin, Navigation, Calendar, Clock, Users, FileText, Sparkles, Plus, Info, ShieldCheck } from 'lucide-react';

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

  // Estados para Precificação Realista por Motorista Particular
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedDriverSettings, setSelectedDriverSettings] = useState<DriverSettings | null>(null);
  const [stopsCount, setStopsCount] = useState<number>(0);

  // Buscar motoristas cadastrados
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const list = await supabaseService.getDrivers();
        setDrivers(list);
        if (list.length > 0) {
          setSelectedDriverId(list[0].id);
        }
      } catch (e) {
        console.error('Erro ao buscar motoristas executivos', e);
      }
    }
    fetchDrivers();
  }, []);

  // Buscar tarifas do motorista selecionado
  useEffect(() => {
    if (!selectedDriverId) return;
    async function fetchDriverSettings() {
      try {
        const settings = await supabaseService.getDriverSettings(selectedDriverId);
        setSelectedDriverSettings(settings);
      } catch (e) {
        console.error('Erro ao buscar tarifas do motorista', e);
      }
    }
    fetchDriverSettings();
  }, [selectedDriverId]);

  // Tarifas de contingência padrão se ainda estiver carregando
  const defaultSettings: DriverSettings = {
    id: '',
    driver_id: selectedDriverId || '',
    fuel_price: 6.00,
    vehicle_consumption_km_l: 10.0,
    monthly_rent: 3000,
    monthly_km_goal: 5000,
    minimum_km_price: 2.00,
    operational_margin_percent: 60,
    displacement_percent: 15,
    night_extra_percent: 25,
    night_extra_start_time: '23:00',
    minimum_trip_price: 40.00,
    stop_fee: 15.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const activeSettings = selectedDriverSettings || defaultSettings;
  const effectiveDistance = tripType === 'ida_e_volta' ? (Number(distanceKm) * 2) : Number(distanceKm);

  // Calcular preço realista profissional em tempo real
  const pricing = calculateRideEstimate(
    activeSettings,
    effectiveDistance,
    scheduledTime,
    stopsCount
  );

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
        driver_id: selectedDriverId || null,
        stops: stopsCount > 0 ? Array.from({ length: stopsCount }, (_, i) => `Parada ${i + 1}`) : null,
        duration_minutes: pricing.duration_minutes,
        base_price: pricing.base_price,
        displacement_fee: pricing.displacement_fee,
        night_fee: pricing.night_fee,
        stop_fee: pricing.stop_fee,
        price_breakdown: {
          driver_km_price: pricing.driver_km_price,
          isMinimumApplied: pricing.isMinimumApplied,
          isNightApplied: pricing.isNightApplied,
          stopsCount: stopsCount,
          effectiveDistance: effectiveDistance
        }
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

        {/* Motorista Particular de Luxo */}
        <div className="bg-roxou-card border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
          <p className="text-[10px] tracking-wider font-semibold text-roxou-neon uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-roxou-neon" />
            Chauffeur Executivo Particular
          </p>
          
          <div className="space-y-3">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">Selecione o Profissional</label>
            <div className="relative">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#12101b]">
                    {d.display_name} - {d.vehicle_model}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview do Motorista Selecionado */}
            {selectedDriverId && drivers.find(d => d.id === selectedDriverId) && (
              (() => {
                const activeD = drivers.find(d => d.id === selectedDriverId)!;
                return (
                  <div className="bg-slate-950/45 border border-slate-900 rounded-xl p-3 flex items-center gap-3 mt-1.5 font-sans">
                    <img
                      src={activeD.photo_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&h=60&q=80'}
                      alt={activeD.display_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-800"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-bold text-white leading-tight truncate">{activeD.display_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{activeD.vehicle_model} • <span className="font-mono text-slate-300">{activeD.vehicle_plate}</span></p>
                      <p className="text-[9px] text-[#a78bfa] font-mono mt-1 font-bold">Tarifa Km Base: {formatCurrency(pricing.driver_km_price)}/km</p>
                    </div>
                  </div>
                );
              })()
            )}
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

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 truncate">Tipo de Trajeto</label>
              <div className="relative">
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
                  className="w-full bg-[#0c0d1b] border border-slate-800 rounded-xl px-2 py-2 text-[10px] text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
                >
                  <option value="ida" className="bg-[#12101b]">Apenas ida</option>
                  <option value="ida_e_volta" className="bg-[#12101b]">Ida/Volta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 truncate">Passageiros</label>
              <div className="relative">
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full bg-[#0c0d1b] border border-slate-800 rounded-xl px-2 py-2 text-[10px] text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
                >
                  <option value={1} className="bg-[#12101b]">1 Pass.</option>
                  <option value={2} className="bg-[#12101b]">2 Pass.</option>
                  <option value={3} className="bg-[#12101b]">3 Pass.</option>
                  <option value={4} className="bg-[#12101b]">4 Lim.</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mb-1 truncate">Paradas Extras</label>
              <div className="relative">
                <select
                  value={stopsCount}
                  onChange={(e) => setStopsCount(Number(e.target.value))}
                  className="w-full bg-[#0c0d1b] border border-slate-800 rounded-xl px-2 py-2 text-[10px] text-slate-100 focus:outline-none focus:border-roxou-purple appearance-none cursor-pointer"
                >
                  <option value={0} className="bg-[#12101b]">Nenhuma</option>
                  <option value={1} className="bg-[#12101b]">1 Parada</option>
                  <option value={2} className="bg-[#12101b]">2 Paradas</option>
                  <option value={3} className="bg-[#12101b]">3 Paradas</option>
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
            <span className="font-display font-semibold text-xs uppercase tracking-wide">Orçamento Executivo Detalhado</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Distância percorrida:</span>
              <span className="font-mono text-slate-100">
                {effectiveDistance} Km {tripType === 'ida_e_volta' ? '(dobrada)' : ''}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Tarifa Base ({formatCurrency(pricing.driver_km_price)}/km):</span>
              <span className="font-mono text-slate-100">{formatCurrency(pricing.base_price)}</span>
            </div>

            <div className="flex justify-between">
              <span>Mobilização / Deslocamento ({activeSettings.displacement_percent}%):</span>
              <span className="font-mono text-slate-100">{formatCurrency(pricing.displacement_fee)}</span>
            </div>

            {pricing.night_fee > 0 && (
              <div className="flex justify-between text-indigo-300">
                <span>Adicional Noturno ({activeSettings.night_extra_percent}%):</span>
                <span className="font-mono">{formatCurrency(pricing.night_fee)}</span>
              </div>
            )}

            {stopsCount > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>{stopsCount} Parada{stopsCount > 1 ? 's' : ''} Adicional{stopsCount > 1 ? 'is' : ''}:</span>
                <span className="font-mono">{formatCurrency(pricing.stop_fee)}</span>
              </div>
            )}

            {pricing.isNightApplied && (
              <div className="flex items-center gap-1 text-[9px] text-[#a78bfa] bg-purple-500/5 px-2 py-1 rounded border border-purple-900/20 mt-1.5">
                <Clock className="w-3 h-3 shrink-0" />
                <span>Gravame de Horário Especial Iniciado</span>
              </div>
            )}

            {pricing.isMinimumApplied && (
              <div className="flex items-center gap-1 text-[9px] text-amber-400 bg-amber-500/5 px-2 py-1 rounded border border-amber-900/20 mt-1.5">
                <Info className="w-3 h-3 shrink-0" />
                <span>Aplicada Tarifa Mínima do Motorista ({formatCurrency(activeSettings.minimum_trip_price)})</span>
              </div>
            )}

            <hr className="border-purple-950 my-2" />

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-250 font-display">Valor Estimado Total:</span>
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
