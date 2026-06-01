/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { PRICING_CONFIG, TripType, DriverSettings } from '../types';

/**
 * Calcula o custo por quilômetro sugerido com base nas configurações individuais do motorista.
 * 
 * fuel_cost_per_km = fuel_price / vehicle_consumption
 * rent_cost_per_km = monthly_rent / monthly_km_goal
 * raw_cost_per_km = fuel_cost_per_km + rent_cost_per_km
 * suggested_km_price = raw_cost_per_km + margem operacional %
 * 
 * Se suggested_km_price < minimum_km_price: usar minimum_km_price
 */
export const calculateDriverKmCost = (settings: DriverSettings): number => {
  const fuel_cost_per_km = settings.fuel_price / (settings.vehicle_consumption_km_l || 1);
  const rent_cost_per_km = settings.monthly_rent / (settings.monthly_km_goal || 1);
  const raw_cost_per_km = fuel_cost_per_km + rent_cost_per_km;
  
  // Margem operacional % do custo bruto (e.g., raw_cost + 60%)
  const suggested_km_price = raw_cost_per_km * (1 + settings.operational_margin_percent / 100);
  
  if (suggested_km_price < settings.minimum_km_price) {
    return settings.minimum_km_price;
  }
  return suggested_km_price;
};

/**
 * Calcula o orçamento estimado profissional de uma corrida para um determinado motorista.
 * 
 * Regra:
 * base = distance_km × driver_km_price
 * displacement_fee = base × displacement_percent
 * night_fee = 0
 * Se horário da viagem for igual ou depois de 23:00 (ou durante a madrugada):
 * night_fee = (base + displacement_fee) × night_extra_percent
 * stop_fee = stops_count × valor_por_parada
 * total = base + displacement_fee + night_fee + stop_fee
 * Se total < minimum_trip_price: total = minimum_trip_price
 */
export const calculateRideEstimate = (
  settings: DriverSettings,
  distanceKm: number,
  scheduledTime: string,
  stopsCount: number
): {
  base_price: number;
  displacement_fee: number;
  night_fee: number;
  stop_fee: number;
  total: number;
  driver_km_price: number;
  isMinimumApplied: boolean;
  isNightApplied: boolean;
  duration_minutes: number;
} => {
  const driver_km_price = calculateDriverKmCost(settings);
  const base = distanceKm * driver_km_price;
  const displacement_fee = base * (settings.displacement_percent / 100);
  
  let isNightApplied = false;
  let night_fee = 0;
  
  if (scheduledTime) {
    const limitStart = settings.night_extra_start_time || "23:00";
    
    // Converte HH:MM para minutos desde a meia-noite
    const toMinutes = (timeStr: string) => {
      const parts = timeStr.trim().split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };

    const scheduledMin = toMinutes(scheduledTime);
    const limitMin = toMinutes(limitStart);
    
    // Aplica o adicional se for igual/após o horário limite, OU se for de madrugada (até as 6h da manhã por conveniência)
    if (scheduledMin >= limitMin || scheduledMin <= 360) {
      isNightApplied = true;
      night_fee = (base + displacement_fee) * (settings.night_extra_percent / 100);
    }
  }
  
  const stop_fee = stopsCount * (settings.stop_fee || 0);
  let total = base + displacement_fee + night_fee + stop_fee;
  
  let isMinimumApplied = false;
  if (total < settings.minimum_trip_price) {
    total = settings.minimum_trip_price;
    isMinimumApplied = true;
  }
  
  // Estimar a duração da viagem baseada na distância + paradas
  const duration_minutes = Math.max(5, Math.round(distanceKm * 1.5 + stopsCount * 10));
  
  return {
    base_price: base,
    displacement_fee,
    night_fee,
    stop_fee,
    total,
    driver_km_price,
    isMinimumApplied,
    isNightApplied,
    duration_minutes
  };
};

/**
 * Mantém cálculo legível legado (caso algum outro componente dependa dele temporariamente)
 */
export const calculateRidePrice = (distanceKm: number, tripType: TripType): {
  distance: number;
  subtotal: number;
  fee: number;
  total: number;
  isMinimumApplied: boolean;
} => {
  const finalDistance = tripType === 'ida_e_volta' ? distanceKm * 2 : distanceKm;
  const subtotal = finalDistance * PRICING_CONFIG.pricePerKm;
  const fee = PRICING_CONFIG.bookingFee;
  let total = subtotal + fee;
  
  let isMinimumApplied = false;
  if (total < PRICING_CONFIG.minimumPrice) {
    total = PRICING_CONFIG.minimumPrice;
    isMinimumApplied = true;
  }

  return {
    distance: finalDistance,
    subtotal,
    fee,
    total,
    isMinimumApplied
  };
};

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (R$)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
