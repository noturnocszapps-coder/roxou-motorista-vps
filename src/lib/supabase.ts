/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Profile, DriverStatus, DriverStatusType, RideRequest, RideMessage, RideStatus, TripType } from '../types';

// Detectar se as credenciais do Supabase estão configuradas
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val: string) => {
  return !val || val.includes('your-project-id') || val.includes('your-supabase-anon-key') || val === 'MY_SUPABASE_URL';
};

export const isDemoMode = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey);

// Inicializar cliente real se possível, caso contrário exportar null
export const supabase = !isDemoMode ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// SIMULADOR LOCAL PARA MODO DEMO
// ==========================================

// Estado em memória e LocalStorage para o Simulador
const KEY_PROFILES = 'roxou_profiles';
const KEY_STATUS = 'roxou_driver_status';
const KEY_RIDES = 'roxou_rides';
const KEY_MESSAGES = 'roxou_messages';
const KEY_CURRENT_USER = 'roxou_current_user';

// Estado de Callbacks para simular "Realtime" local de forma reativa
type CallbackFn = (...args: any[]) => void;
const listeners: { [event: string]: CallbackFn[] } = {};

const emitLocalEvent = (event: string, ...args: any[]) => {
  if (listeners[event]) {
    listeners[event].forEach(cb => cb(...args));
  }
};

const subscribeLocalEvent = (event: string, callback: CallbackFn) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
};

// Carregar dados iniciais no mock
const initMockDB = () => {
  if (!localStorage.getItem(KEY_STATUS)) {
    localStorage.setItem(KEY_STATUS, JSON.stringify({
      id: 1,
      status: 'online',
      updated_at: new Date().toISOString(),
      updated_by: 'admin-id'
    }));
  }

  const defaultAdmin: Profile = {
    id: 'admin-id-demo',
    email: 'contato.fh3@gmail.com',
    full_name: 'Motorista Roxou (Admin)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const defaultUser: Profile = {
    id: 'user-id-demo',
    email: 'passageiro@exemplo.com',
    full_name: 'Marcos Silva',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'passageiro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedProfiles: Profile[] = [];
  try {
    savedProfiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
  } catch (e) {
    savedProfiles = [];
  }

  if (savedProfiles.length === 0) {
    savedProfiles = [defaultAdmin, defaultUser];
    localStorage.setItem(KEY_PROFILES, JSON.stringify(savedProfiles));
  }

  if (!localStorage.getItem(KEY_RIDES)) {
    const mockRides: RideRequest[] = [
      {
        id: 'ride-1',
        user_id: 'user-id-demo',
        origin: 'Aeroporto Internacional de Guarulhos, SP',
        destination: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
        scheduled_date: new Date(Date.now() + 86450000).toISOString().split('T')[0],
        scheduled_time: '14:00',
        distance_km: 28.5,
        trip_type: 'ida',
        passenger_count: 2,
        observation: 'Voo da Latam LA4122. Estarei com 2 malas grandes.',
        estimated_price: 91.25,
        final_price: null,
        status: 'pendente',
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ride-2',
        user_id: 'user-id-demo',
        origin: 'Shopping Cidade São Paulo, SP',
        destination: 'Alameda Lorena, 250 - Jardins, SP',
        scheduled_date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        scheduled_time: '10:30',
        distance_km: 4.2,
        trip_type: 'ida_e_volta',
        passenger_count: 1,
        observation: 'Consulta médica rápida.',
        estimated_price: 41.00,
        final_price: 45.00,
        status: 'concluido',
        rejection_reason: null,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    localStorage.setItem(KEY_RIDES, JSON.stringify(mockRides));
  }

  if (!localStorage.getItem(KEY_MESSAGES)) {
    const mockMessages: RideMessage[] = [
      {
        id: 'msg-1',
        ride_id: 'ride-1',
        sender_id: 'user-id-demo',
        message: 'Olá! Confirmando o local exato do embarque em Cumbica.',
        created_at: new Date(Date.now() - 10000).toISOString()
      },
      {
        id: 'msg-2',
        ride_id: 'ride-2',
        sender_id: 'user-id-demo',
        message: 'Já estou no aguardo.',
        created_at: new Date(Date.now() - 172800000 + 3000).toISOString()
      },
      {
        id: 'msg-3',
        ride_id: 'ride-2',
        sender_id: 'admin-id-demo',
        message: 'Perfeito, estacionando na frente da clínica.',
        created_at: new Date(Date.now() - 172800000 + 6000).toISOString()
      }
    ];
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(mockMessages));
  }
};

// Rodar inicializador
if (isDemoMode) {
  initMockDB();
}

// Auxiliar para mapear linhas do banco de dados de volta para a interface RideRequest do front-end
function mapDbToRideRequest(db: any): RideRequest {
  if (!db) return null as any;
  
  // Extrair data (scheduled_date) e hora (scheduled_time) a partir de scheduled_at
  let scheduled_date = '';
  let scheduled_time = '';
  
  if (db.scheduled_at) {
    try {
      const parts = db.scheduled_at.split('T');
      if (parts.length >= 2) {
        scheduled_date = parts[0];
        scheduled_time = parts[1].substring(0, 5);
      } else {
        scheduled_date = db.scheduled_at;
        scheduled_time = '12:00';
      }
    } catch (e) {
      console.warn('Erro ao mapear scheduled_at:', e);
      scheduled_date = db.scheduled_at;
      scheduled_time = '12:00';
    }
  } else if (db.scheduled_date) {
    scheduled_date = db.scheduled_date;
    scheduled_time = db.scheduled_time || '12:00';
  }

  return {
    id: db.id,
    user_id: db.passenger_id || db.user_id || '',
    origin: db.origin,
    destination: db.destination,
    scheduled_date,
    scheduled_time,
    distance_km: db.distance_km ? Number(db.distance_km) : 0,
    trip_type: db.trip_type,
    passenger_count: db.passengers || db.passenger_count || 1,
    observation: db.notes || db.observation || null,
    estimated_price: db.estimated_price ? Number(db.estimated_price) : 0,
    final_price: db.final_price !== null && db.final_price !== undefined ? Number(db.final_price) : null,
    status: db.status,
    rejection_reason: db.rejection_reason || null,
    created_at: db.created_at,
    updated_at: db.updated_at,
    profiles: db.profiles ? {
      id: db.profiles.id,
      email: db.profiles.email,
      full_name: db.profiles.full_name || db.profiles.name || 'Passageiro',
      avatar_url: db.profiles.avatar_url || null,
      role: db.profiles.role,
      created_at: db.profiles.created_at || '',
      updated_at: db.profiles.updated_at || ''
    } : undefined
  };
}

// ==========================================
// SERVIÇO DE SUPABASE UNIFICADO
// Cobre tanto o modo Demo local quanto a API real do Supabase
// ==========================================

export const supabaseService = {
  // --- AUTENTICAÇÃO ---
  async signInWithGoogle(): Promise<{ error: any }> {
    if (isDemoMode) {
      // No modo demo, o login simplesmente usará o login fake selecionado.
      return { error: null };
    }
    
    // Obter redirecionamento adequado para Google OAuth
    const isProd = typeof window !== 'undefined' && window.location.hostname === 'reserva.roxou.com.br';
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const redirectTo = isProd 
      ? 'https://reserva.roxou.com.br' 
      : (isLocal ? 'http://localhost:5173' : (typeof window !== 'undefined' ? window.location.origin : ''));

    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo
      }
    });
    return { error };
  },

  async signOut(): Promise<{ error: any }> {
    if (isDemoMode) {
      localStorage.removeItem(KEY_CURRENT_USER);
      emitLocalEvent('auth_change', null);
      return { error: null };
    }
    const { error } = await supabase!.auth.signOut();
    return { error };
  },

  async getCurrentUser(): Promise<Profile | null> {
    if (isDemoMode) {
      const userJSON = localStorage.getItem(KEY_CURRENT_USER);
      if (!userJSON) {
        // Por padrão logar primeiramente como Marcos Silva (passageiro) para testar
        const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
        const passenger = profiles.find((p: Profile) => p.role === 'passageiro') || null;
        if (passenger) {
          localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(passenger));
          return passenger;
        }
        return null;
      }
      return JSON.parse(userJSON);
    }

    const fetchUserPromise = async (): Promise<Profile | null> => {
      try {
        console.log('[AUTH] start getCurrentUser fetch');
        if (!supabase) {
          console.warn('[AUTH] supabase client not initialized');
          return null;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log('[AUTH] user not logged in or error:', userError);
          return null;
        }
        console.log('[AUTH] session loaded for user:', user.email);

        // Buscar perfil correspondente no banco usando maybeSingle() para evitar erro de Content Negotiation 406
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[AUTH] Erro ao buscar perfil com maybeSingle:', error);
          console.log('[AUTH] profile failed');
        }

        if (!profile) {
          console.log('[AUTH] profile does not exist, creating new profile...');
          const newProfile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Passageiro',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: user.email === 'contato.fh3@gmail.com' ? 'admin' : 'passageiro'
          };

          // Usa insert em vez de upsert para evitar erros de RLS e triggers de actualização (400 Bad Request)
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .maybeSingle();
          
          if (insertError) {
            console.log('[AUTH] Inserção direta falhou/ignorada:', insertError);
            // Recarregar perfil novamente
            const { data: reloadedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            console.log('[AUTH] profile reloaded after fallback:', reloadedProfile);
            return reloadedProfile as Profile || null;
          }
          
          console.log('[AUTH] profile loaded (newly created):', insertedProfile);
          return insertedProfile as Profile;
        }

        console.log('[AUTH] profile loaded:', profile.email);
        return profile as Profile;
      } catch (e) {
        console.error('[AUTH] erro interno no fetchUserPromise:', e);
        console.log('[AUTH] profile failed with exception');
        return null;
      }
    };

    // Timeout de segurança de no máximo 5 segundos
    return Promise.race([
      fetchUserPromise(),
      new Promise<Profile | null>((resolve) => {
        setTimeout(() => {
          console.warn('[AUTH] timeout de 5 segundos atingido ao buscar usuário do Supabase');
          console.log('[AUTH] profile failed (timeout)');
          resolve(null);
        }, 5000);
      })
    ]);
  },

  // Simulação para o Painel de Desenvolvimento trocar de usuário rapidamente
  demoLoginAs(role: 'admin' | 'passageiro', customEmail?: string) {
    if (!isDemoMode) return;
    const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
    let profile = profiles.find((p: Profile) => p.role === role);
    
    if (customEmail) {
      profile = profiles.find((p: Profile) => p.email === customEmail);
      if (!profile) {
        profile = {
          id: 'custom-' + Math.random().toString(36).substr(2, 9),
          email: customEmail,
          full_name: customEmail.split('@')[0],
          avatar_url: null,
          role: customEmail === 'contato.fh3@gmail.com' ? 'admin' : 'passageiro',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        profiles.push(profile);
        localStorage.setItem(KEY_PROFILES, JSON.stringify(profiles));
      }
    }

    if (profile) {
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(profile));
      emitLocalEvent('auth_change', profile);
    }
  },

  subscribeToAuth(callback: (user: Profile | null) => void) {
    if (isDemoMode) {
      return subscribeLocalEvent('auth_change', callback);
    }

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] onAuthStateChange event fired:', event);
        try {
          if (session?.user) {
            const profile = await this.getCurrentUser();
            callback(profile);
          } else {
            console.log('[AUTH] session loaded: null (logged out)');
            callback(null);
          }
        } catch (authError) {
          console.error('[AUTH] erro no listener do state change:', authError);
          console.log('[AUTH] profile failed in subscription callback handler');
          callback(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  },

  // --- MOTORISTA STATUS ---
  async getDriverStatus(): Promise<DriverStatus> {
    if (isDemoMode) {
      return JSON.parse(localStorage.getItem(KEY_STATUS) || '{"id": 1, "status": "offline"}');
    }

    try {
      const { data, error } = await supabase!
        .from('driver_status')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { id: 1, status: 'offline', updated_at: new Date().toISOString(), updated_by: null };
      }
      const raw = data as any;
      return {
        id: raw.id,
        driver_id: raw.driver_id,
        status: raw.status,
        updated_at: raw.updated_at,
        updated_by: raw.driver_id || null
      };
    } catch (err) {
      console.error('Erro ao buscar status do motorista real:', err);
      return { id: 1, status: 'offline', updated_at: new Date().toISOString(), updated_by: null };
    }
  },

  async updateDriverStatus(status: DriverStatusType, adminUserId: string): Promise<boolean> {
    const updated_at = new Date().toISOString();
    
    if (isDemoMode) {
      const current = { id: 1, status, updated_at, updated_by: adminUserId };
      localStorage.setItem(KEY_STATUS, JSON.stringify(current));
      emitLocalEvent('driver_status_change', current);
      return true;
    }

    try {
      // Buscar se já existe registro com aquele driverId
      const { data: existing } = await supabase!
        .from('driver_status')
        .select('id')
        .eq('driver_id', adminUserId)
        .maybeSingle();

      let query;
      if (existing) {
        query = supabase!
          .from('driver_status')
          .update({ status, updated_at })
          .eq('driver_id', adminUserId);
      } else {
        query = supabase!
          .from('driver_status')
          .insert({ driver_id: adminUserId, status, updated_at });
      }

      const { error } = await query;
      return !error;
    } catch (err) {
      console.error('Erro ao atualizar driver status:', err);
      return false;
    }
  },

  subscribeToDriverStatus(callback: (status: DriverStatus) => void) {
    if (isDemoMode) {
      return subscribeLocalEvent('driver_status_change', callback);
    }

    // Usando Supabase Realtime
    const channel = supabase!
      .channel('driver_status_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_status' },
        (payload) => {
          if (payload.new) {
            const rawNew = payload.new as any;
            callback({
              id: rawNew.id,
              driver_id: rawNew.driver_id,
              status: rawNew.status,
              updated_at: rawNew.updated_at,
              updated_by: rawNew.driver_id || null
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  },

  // --- SOLICITAÇÕES DE RESERVA ---
  async createRideRequest(data: {
    origin: string;
    destination: string;
    scheduled_date: string;
    scheduled_time: string;
    distance_km: number;
    trip_type: TripType;
    passenger_count: number;
    observation: string | null;
    estimated_price: number;
    user_id: string;
  }): Promise<RideRequest | null> {
    const newRide: RideRequest = {
      id: isDemoMode ? 'ride-' + Math.random().toString(36).substr(2, 9) : undefined as any,
      user_id: data.user_id,
      origin: data.origin,
      destination: data.destination,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      distance_km: Number(data.distance_km),
      trip_type: data.trip_type,
      passenger_count: Number(data.passenger_count),
      observation: data.observation,
      estimated_price: Number(data.estimated_price),
      final_price: null,
      status: 'pendente',
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isDemoMode) {
      const rides = JSON.parse(localStorage.getItem(KEY_RIDES) || '[]');
      rides.unshift(newRide);
      localStorage.setItem(KEY_RIDES, JSON.stringify(rides));
      emitLocalEvent('rides_change');
      return newRide;
    }

    try {
      // Mapear campos para colunas reais no banco
      const dbRide = {
        passenger_id: data.user_id,
        origin: data.origin,
        destination: data.destination,
        scheduled_at: `${data.scheduled_date}T${data.scheduled_time}:00Z`,
        distance_km: Number(data.distance_km),
        trip_type: data.trip_type,
        passengers: Number(data.passenger_count),
        notes: data.observation,
        estimated_price: Number(data.estimated_price),
        status: 'pendente',
        final_price: null,
        rejection_reason: null,
        payment_confirmed: false
      };

      const { data: inserted, error } = await supabase!
        .from('ride_requests')
        .insert(dbRide)
        .select()
        .maybeSingle();

      if (error || !inserted) {
        console.error('Erro ao salvar reserva', error);
        return null;
      }
      return mapDbToRideRequest(inserted);
    } catch (err) {
      console.error('Exceção ao criar solicitação de reserva:', err);
      return null;
    }
  },

  async getRideRequests(userRole: 'admin' | 'passageiro', userId: string): Promise<RideRequest[]> {
    if (isDemoMode) {
      const rides: RideRequest[] = JSON.parse(localStorage.getItem(KEY_RIDES) || '[]');
      const profiles: Profile[] = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
      
      // Mapear profiles neles
      const fullRides = rides.map(r => ({
        ...r,
        profiles: profiles.find(p => p.id === r.user_id)
      }));

      if (userRole === 'admin') {
        return fullRides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        return fullRides
          .filter(r => r.user_id === userId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    try {
      // Usar joion em profiles utilizando a relação de passenger_id para evitar incompatibilidades
      let query = supabase!
        .from('ride_requests')
        .select('*, profiles:passenger_id(*)');

      if (userRole !== 'admin') {
        query = query.eq('passenger_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao buscar reservas reais', error);
        return [];
      }
      return (data || []).map(row => mapDbToRideRequest(row));
    } catch (err) {
      console.error('Exceção ao buscar solicitações de reservas:', err);
      return [];
    }
  },

  async getRideRequestById(id: string): Promise<RideRequest | null> {
    if (isDemoMode) {
      const rides: RideRequest[] = JSON.parse(localStorage.getItem(KEY_RIDES) || '[]');
      const ride = rides.find(r => r.id === id) || null;
      if (ride) {
        const profiles: Profile[] = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
        ride.profiles = profiles.find(p => p.id === ride.user_id);
      }
      return ride;
    }

    try {
      const { data, error } = await supabase!
        .from('ride_requests')
        .select('*, profiles:passenger_id(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        console.error('Erro ao buscar reserva por ID real', error);
        return null;
      }
      return mapDbToRideRequest(data);
    } catch (err) {
      console.error('Exceção ao buscar reserva por ID:', err);
      return null;
    }
  },

  async updateRideRequest(
    id: string,
    updates: {
      status: RideStatus;
      final_price?: number | null;
      rejection_reason?: string | null;
    }
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (isDemoMode) {
      const rides: RideRequest[] = JSON.parse(localStorage.getItem(KEY_RIDES) || '[]');
      const index = rides.findIndex(r => r.id === id);
      if (index !== -1) {
        rides[index] = {
          ...rides[index],
          ...updates,
          updated_at: now
        };
        localStorage.setItem(KEY_RIDES, JSON.stringify(rides));
        emitLocalEvent('rides_change');
        emitLocalEvent(`ride_status_${id}`, rides[index]);
        return true;
      }
      return false;
    }

    try {
      const updatePayload: any = {
        status: updates.status,
        updated_at: now
      };

      if (updates.final_price !== undefined) {
        updatePayload.final_price = updates.final_price;
      }
      if (updates.rejection_reason !== undefined) {
        updatePayload.rejection_reason = updates.rejection_reason;
      }

      const { error } = await supabase!
        .from('ride_requests')
        .update(updatePayload)
        .eq('id', id);

      return !error;
    } catch (err) {
      console.error('Exceção ao atualizar status da reserva:', err);
      return false;
    }
  },

  subscribeToRideRequest(id: string, callback: (ride: RideRequest) => void) {
    if (isDemoMode) {
      return subscribeLocalEvent(`ride_status_${id}`, callback);
    }

    const channel = supabase!
      .channel(`ride_realtime_${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ride_requests', filter: `id=eq.${id}` },
        async (payload) => {
          // Recarregar com os profiles
          const refreshed = await this.getRideRequestById(id);
          if (refreshed) {
            callback(refreshed);
          }
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  },

  subscribeToAllRides(callback: () => void) {
    if (isDemoMode) {
      return subscribeLocalEvent('rides_change', callback);
    }

    const channel = supabase!
      .channel('all_rides_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_requests' },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  },

  // --- MESSAGES ---
  async getMessages(rideId: string): Promise<RideMessage[]> {
    if (isDemoMode) {
      const messages: RideMessage[] = JSON.parse(localStorage.getItem(KEY_MESSAGES) || '[]');
      const profiles: Profile[] = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
      
      return messages
        .filter(m => m.ride_id === rideId)
        .map(m => ({
          ...m,
          profiles: profiles.find(p => p.id === m.sender_id)
        }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    const { data, error } = await supabase!
      .from('ride_messages')
      .select('*, profiles:sender_id(*)')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mensagens do chat real', error);
      return [];
    }
    return data as RideMessage[];
  },

  async sendMessage(rideId: string, senderId: string, messageText: string): Promise<RideMessage | null> {
    const newMessage: RideMessage = {
      id: isDemoMode ? 'msg-' + Math.random().toString(36).substr(2, 9) : undefined as any,
      ride_id: rideId,
      sender_id: senderId,
      message: messageText,
      created_at: new Date().toISOString()
    };

    if (isDemoMode) {
      const messages = JSON.parse(localStorage.getItem(KEY_MESSAGES) || '[]');
      messages.push(newMessage);
      localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
      emitLocalEvent(`messages_change_${rideId}`, newMessage);
      return newMessage;
    }

    const { data: inserted, error } = await supabase!
      .from('ride_messages')
      .insert({
        ride_id: rideId,
        sender_id: senderId,
        message: messageText
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem real', error);
      return null;
    }
    return inserted as RideMessage;
  },

  subscribeToMessages(rideId: string, callback: (msg: RideMessage) => void) {
    if (isDemoMode) {
      // Para simular reatividade das mensagens recebendo profiles corretos
      return subscribeLocalEvent(`messages_change_${rideId}`, (msg: RideMessage) => {
        const profiles = JSON.parse(localStorage.getItem(KEY_PROFILES) || '[]');
        msg.profiles = profiles.find((p: Profile) => p.id === msg.sender_id);
        callback(msg);
      });
    }

    const channel = supabase!
      .channel(`chat_realtime_${rideId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_messages', filter: `ride_id=eq.${rideId}` },
        async (payload) => {
          // Buscar info do remetente
          const senderId = payload.new.sender_id;
          const { data: profile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', senderId)
            .single();

          const messageFull: RideMessage = {
            id: payload.new.id,
            ride_id: payload.new.ride_id,
            sender_id: senderId,
            message: payload.new.message,
            created_at: payload.new.created_at,
            profiles: profile as Profile || undefined
          };
          callback(messageFull);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }
};
