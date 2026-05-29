/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRICING_CONFIG, TripType } from '../types';

/**
 * Calcula o preço estimado de uma viagem com base na distância e tipo de trajeto.
 * 
 * Regra:
 * - Se for ida e volta, distância x 2.
 * - Valor = distância calculada x 2.50 + 20.
 * - Se valor for menor que 30, usar 30.
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
