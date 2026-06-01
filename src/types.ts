/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'passageiro' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type DriverStatusType = 'online' | 'ocupado' | 'offline';

export interface DriverStatus {
  id: number | string;
  driver_id?: string | null;
  status: DriverStatusType;
  updated_at: string;
  updated_by?: string | null;
}

export type RideStatus =
  | 'pendente'              // Aguardando admin aprovar orçamento
  | 'aprovado'              // Orçamento aprovado, aguardando pagamento/confirmação
  | 'recusado'              // Recusado pelo admin com motivo
  | 'confirmado_pagamento'  // Cliente enviou pagamento, aguardando admin confirmar reserva
  | 'confirmado_reserva'    // Viagem confirmada de fato
  | 'em_viagem'             // Viagem iniciada
  | 'concluido'             // Viagem finalizada com sucesso
  | 'cancelado';            // Cancelada por passageiro ou admin

export type TripType = 'ida' | 'ida_e_volta';

export interface RideRequest {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM
  distance_km: number;
  trip_type: TripType;
  passenger_count: number;
  observation: string | null;
  estimated_price: number;
  final_price: number | null;
  status: RideStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Campo opcional para carregar informações do perfil com a solicitação
  profiles?: Profile;

  // Lógica Profissional de Precificação Roxou
  driver_id?: string | null;
  stops?: string[] | any; // JSONB no banco, array ou string no front
  duration_minutes?: number | null;
  base_price?: number | null;
  displacement_fee?: number | null;
  night_fee?: number | null;
  stop_fee?: number | null;
  price_breakdown?: any; // JSONB contendo o detalhamento de custos
  drivers?: Driver; // Relação opcional com motoristas
}

export interface Driver {
  id: string;
  profile_id?: string | null;
  display_name: string;
  photo_url: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_photo_url: string;
  status: DriverStatusType;
  created_at: string;
  updated_at: string;
}

export interface DriverSettings {
  id: string;
  driver_id: string;
  fuel_price: number;
  vehicle_consumption_km_l: number;
  monthly_rent: number;
  monthly_km_goal: number;
  minimum_km_price: number;
  operational_margin_percent: number;
  displacement_percent: number;
  night_extra_percent: number;
  night_extra_start_time: string; // e.g. "23:00"
  minimum_trip_price: number;
  stop_fee: number;
  created_at: string;
  updated_at: string;
}

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  
  // Campo opcional para carregar informações do perfil do remetente
  profiles?: Profile;
}

// Configurações Globais Inicialmente Fixas
export const PRICING_CONFIG = {
  pricePerKm: 2.50,
  bookingFee: 20.00,
  minimumPrice: 30.00,
  maxPassengers: 4,
};
