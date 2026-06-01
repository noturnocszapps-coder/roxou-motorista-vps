/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { isDemoMode, supabaseService } from '../../lib/supabase';
import { Profile, DriverStatus, DriverStatusType, RideRequest, RideStatus, PRICING_CONFIG, Driver, DriverSettings } from '../../types';
import { formatCurrency } from '../../lib/pricing';
import { useLocation, navigate } from '../../lib/navigation';
import {
  Shield,
  Circle,
  Clock,
  Car,
  TrendingUp,
  Calendar,
  Settings,
  Grid,
  Loader2,
  Users,
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  ArrowRight,
  ChevronRight,
  Info,
  RefreshCw,
  Phone,
  Mail,
  User,
  Sparkles,
  Building2,
  ChevronLeft,
  Map,
  MapPin,
  Navigation,
  Compass,
  Star,
  Wifi,
  Battery,
  Signal,
  Briefcase,
  Activity
} from 'lucide-react';
import { RideCard, getRideStatusConfig } from '../RideCard';

interface AdminProps {
  currentUser: Profile;
  onRefreshUser: () => void;
}

export function AdminDashboardView({ currentUser, onRefreshUser }: AdminProps) {
  const { currentPath } = useLocation();
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para edição de preços nas configurações
  const [priceKm, setPriceKm] = useState(String(PRICING_CONFIG.pricePerKm));
  const [bookFee, setBookFee] = useState(String(PRICING_CONFIG.bookingFee));
  const [minPrice, setMinPrice] = useState(String(PRICING_CONFIG.minimumPrice));
  const [maxPassengers, setMaxPassengers] = useState(String(PRICING_CONFIG.maxPassengers));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  
  // Abas de Agenda (visual do dia)
  const [agendaTab, setAgendaTab] = useState<'hoje' | 'amanha' | 'semana'>('hoje');

  // Lógica Profissional de Precificação Roxou
  const [adminDrivers, setAdminDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [pricingSettings, setPricingSettings] = useState<DriverSettings | null>(null);
  const [isPricingSaving, setIsPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar motoristas e configurações de precificação
  useEffect(() => {
    async function loadPricingData() {
      const driversList = await supabaseService.getDrivers();
      setAdminDrivers(driversList);
      if (driversList.length > 0 && !selectedDriverId) {
        setSelectedDriverId(driversList[0].id);
      }
    }
    loadPricingData();
  }, [rides]);

  useEffect(() => {
    if (!selectedDriverId) return;
    async function loadDriverPricing() {
      const settings = await supabaseService.getDriverSettings(selectedDriverId);
      if (settings) {
        setPricingSettings(settings);
      } else {
        setPricingSettings({
          id: '',
          driver_id: selectedDriverId,
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
        });
      }
    }
    loadDriverPricing();
    setPricingMessage(null);
  }, [selectedDriverId]);

  // Simulador de precificação ao vivo na tela administrativa
  const liveCostAndPrice = useMemo(() => {
    if (!pricingSettings) return { raw: 0, suggested: 0, final: 0 };
    const fuel = Number(pricingSettings.fuel_price) || 0;
    const cons = Number(pricingSettings.vehicle_consumption_km_l) || 1;
    const rent = Number(pricingSettings.monthly_rent) || 0;
    const goal = Number(pricingSettings.monthly_km_goal) || 1;
    const minKm = Number(pricingSettings.minimum_km_price) || 0;
    const margin = Number(pricingSettings.operational_margin_percent) || 0;
    
    const fuel_cost = fuel / cons;
    const rent_cost = rent / goal;
    const raw = fuel_cost + rent_cost;
    const sug = raw * (1 + margin / 100);
    const fin = Math.max(sug, minKm);
    
    return { raw, suggested: sug, final: fin };
  }, [pricingSettings]);

  const handleSaveDriverPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !pricingSettings) return;
    setIsPricingSaving(true);
    setPricingMessage(null);
    try {
      const success = await supabaseService.updateDriverSettings(selectedDriverId, {
        fuel_price: Number(pricingSettings.fuel_price),
        vehicle_consumption_km_l: Number(pricingSettings.vehicle_consumption_km_l),
        monthly_rent: Number(pricingSettings.monthly_rent),
        monthly_km_goal: Number(pricingSettings.monthly_km_goal),
        minimum_km_price: Number(pricingSettings.minimum_km_price),
        operational_margin_percent: Number(pricingSettings.operational_margin_percent),
        displacement_percent: Number(pricingSettings.displacement_percent),
        night_extra_percent: Number(pricingSettings.night_extra_percent),
        night_extra_start_time: pricingSettings.night_extra_start_time,
        minimum_trip_price: Number(pricingSettings.minimum_trip_price),
        stop_fee: Number(pricingSettings.stop_fee)
      });
      if (success) {
        setPricingMessage({ type: 'success', text: 'Configurações de precificação salvas com sucesso!' });
        setTimeout(() => setPricingMessage(null), 4000);
      } else {
        setPricingMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
      }
    } catch (err) {
      console.error(err);
      setPricingMessage({ type: 'error', text: 'Ocorreu um erro no salvamento.' });
    } finally {
      setIsPricingSaving(false);
    }
  };

  // Relógio em tempo real de nível executivo
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mapear rota atual para a aba/seção do SaaS
  const activeTab = useMemo(() => {
    if (currentPath === '/admin/solicitacoes') return 'solicitacoes';
    if (currentPath === '/admin/agenda') return 'agenda';
    if (currentPath === '/admin/clientes') return 'clientes';
    if (currentPath === '/admin/motoristas') return 'motoristas';
    if (currentPath === '/admin/precificacao') return 'precificacao';
    if (currentPath === '/admin/financeiro') return 'financeiro';
    if (currentPath === '/admin/configuracoes') return 'configuracoes';
    return 'dashboard'; // padrão /admin ou /
  }, [currentPath]);

  // Carregar dados iniciais e assinar atualizações reativas do banco
  async function loadData() {
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
    setLoading(true);
    loadData();

    // Sincronização reativa via assinatura Supabase
    const unsubscribeRides = supabaseService.subscribeToAllRides(() => {
      loadData();
    });

    return () => {
      unsubscribeRides();
    };
  }, [currentUser.id]);

  // Alterar disponibilidade do motorista (Uber Driver Widget)
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

  // Drag and Drop do Kanban
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, rideId: string) => {
    e.dataTransfer.setData('text/plain', rideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverCol(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: RideStatus) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const rideId = e.dataTransfer.getData('text/plain');
    if (!rideId) return;

    // Atualizar status no Supabase
    try {
      // Definir preço padrão se estiver aprovando
      const rideToUpdate = rides.find(r => r.id === rideId);
      if (!rideToUpdate) return;

      const payload: any = { status: targetStatus };
      if (targetStatus === 'aprovado' && !rideToUpdate.final_price) {
        payload.final_price = rideToUpdate.estimated_price;
      }

      const success = await supabaseService.updateRideRequest(rideId, payload);
      if (success) {
        // Atualização local imediata antes da notificação do canal reativo
        setRides(prev => prev.map(r => r.id === rideId ? { ...r, ...payload, updated_at: new Date().toISOString() } : r));
      }
    } catch (err) {
      console.error('Falha no Drag & Drop', err);
    }
  };

  // Salvar configurações de preço
  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    PRICING_CONFIG.pricePerKm = Number(priceKm) || 2.50;
    PRICING_CONFIG.bookingFee = Number(bookFee) || 20.00;
    PRICING_CONFIG.minimumPrice = Number(minPrice) || 30.00;
    PRICING_CONFIG.maxPassengers = Number(maxPassengers) || 4;
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Resetar base de teste do simulador
  const handleResetDemoDb = () => {
    if (!isDemoMode) return;
    if (confirm('Deseja realmente apagar todas as viagens inseridas, conversas e restaurar o estado padrão do simulador?')) {
      setResettingDemo(true);
      setTimeout(() => {
        localStorage.removeItem('roxou_profiles');
        localStorage.removeItem('roxou_driver_status');
        localStorage.removeItem('roxou_rides');
        localStorage.removeItem('roxou_messages');
        localStorage.removeItem('roxou_current_user');
        window.location.reload();
      }, 700);
    }
  };

  // Cálculos de Estatísticas
  const concludedTrips = useMemo(() => rides.filter(r => r.status === 'concluido'), [rides]);
  
  // Total faturado histórico
  const totalConcludedEarnings = useMemo(() => {
    return concludedTrips.reduce((acc, r) => acc + (r.final_price || r.estimated_price), 0);
  }, [concludedTrips]);

  // Ganhos do mês atual
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthName = monthNames[now.getMonth()];

  const monthlyConcludedTrips = useMemo(() => {
    return concludedTrips.filter(r => r.scheduled_date && r.scheduled_date.startsWith(currentMonthKey));
  }, [concludedTrips, currentMonthKey]);

  const totalMonthlyEarnings = useMemo(() => {
    return monthlyConcludedTrips.reduce((acc, r) => acc + (r.final_price || r.estimated_price), 0);
  }, [monthlyConcludedTrips]);

  // Reservas Ativas
  const activeTripsCount = useMemo(() => {
    return rides.filter(r => r.status === 'em_viagem' || r.status === 'confirmado_reserva' || r.status === 'confirmado_pagamento').length;
  }, [rides]);

  // Ticket Médio
  const averageTicket = useMemo(() => {
    return concludedTrips.length > 0 ? totalConcludedEarnings / concludedTrips.length : 0;
  }, [concludedTrips, totalConcludedEarnings]);

  // Estatísticas do Dia (Mobilidade Executiva)
  const todayKey = useMemo(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, [now]);

  const todayRides = useMemo(() => {
    return rides.filter(r => r.scheduled_date === todayKey);
  }, [rides, todayKey]);

  const todayConcludedRides = useMemo(() => {
    return todayRides.filter(r => r.status === 'concluido');
  }, [todayRides]);

  const totalTodayEarnings = useMemo(() => {
    return todayRides.reduce((acc, r) => {
      // Includes completed or active ones as estimated to give partial live revenue
      if (r.status === 'concluido' || r.status === 'em_viagem') {
        return acc + (r.final_price || r.estimated_price || 0);
      }
      return acc;
    }, 0);
  }, [todayRides]);

  const nextRide = useMemo(() => {
    const activeOrUpcoming = rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem');
    // Sort chronologically if needed, already sorted by query or creation
    return activeOrUpcoming[0] || null;
  }, [rides]);

  // Clientes Únicos
  const clientsData = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; totalSpent: number; tripsCount: number; lastTripDate: string }>();
    
    rides.forEach(ride => {
      const email = ride.profiles?.email || 'passageiro@exemplo.com';
      const name = ride.profiles?.full_name || 'Passageiro Anônimo';
      const price = ride.final_price || ride.estimated_price || 0;
      
      const isConcluded = ride.status === 'concluido';
      
      if (!map.has(email)) {
        map.set(email, {
          id: ride.user_id,
          name,
          email,
          totalSpent: isConcluded ? price : 0,
          tripsCount: 1,
          lastTripDate: ride.scheduled_date
        });
      } else {
        const existing = map.get(email)!;
        existing.tripsCount += 1;
        if (isConcluded) existing.totalSpent += price;
        if (ride.scheduled_date > existing.lastTripDate) {
          existing.lastTripDate = ride.scheduled_date;
        }
      }
    });

    return Array.from(map.values());
  }, [rides]);

  const filteredClients = useMemo(() => {
    return clientsData.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clientsData, searchQuery]);

  // Filtrar viagens da Agenda
  const agendaRides = useMemo(() => {
    const activeAgendas = rides.filter(r => 
      r.status === 'confirmado_reserva' || r.status === 'em_viagem' || r.status === 'confirmado_pagamento' || r.status === 'aprovado'
    );
    
    // Formatar strings de datas
    const todayStr = new Date().toISOString().split('T')[0];
    
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = weekLater.toISOString().split('T')[0];

    const filtered = activeAgendas.filter(r => {
      if (agendaTab === 'hoje') return r.scheduled_date === todayStr;
      if (agendaTab === 'amanha') return r.scheduled_date === tomorrowStr;
      return r.scheduled_date >= todayStr && r.scheduled_date <= weekLaterStr;
    });

    return filtered.sort((a, b) => {
      const dComp = a.scheduled_date.localeCompare(b.scheduled_date);
      if (dComp !== 0) return dComp;
      return a.scheduled_time.localeCompare(b.scheduled_time);
    });
  }, [rides, agendaTab]);

  // Formatar data em português amigável
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dummyDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const weekday = dummyDate.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayMonth = `${parts[2]}/${parts[1]}`;
        return `${weekday.toUpperCase()} - ${dayMonth}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Destinos mais frequentes
  const topDestinations = useMemo(() => {
    const counts: Record<string, number> = {};
    rides.forEach(r => {
      const dest = r.destination.split(',')[0].trim();
      counts[dest] = (counts[dest] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [rides]);

  // Lista de itens do menu lateral
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'solicitacoes', label: 'Central de Reservas', icon: ClipboardList, path: '/admin/solicitacoes', badge: rides.filter(r => r.status === 'pendente' || r.status === 'confirmado_pagamento').length },
    { id: 'agenda', label: 'Agenda Executiva', icon: Calendar, path: '/admin/agenda' },
    { id: 'clientes', label: 'Clientes', icon: Users, path: '/admin/clientes' },
    { id: 'motoristas', label: 'Controle da Frota', icon: Car, path: '/admin/motoristas' },
    { id: 'precificacao', label: 'Precificação', icon: TrendingUp, path: '/admin/precificacao' },
    { id: 'financeiro', label: 'Faturamento', icon: DollarSign, path: '/admin/financeiro' },
    { id: 'configuracoes', label: 'Operação', icon: Settings, path: '/admin/configuracoes' }
  ];

  return (
    <div className="flex-grow w-full flex bg-[#030305] bg-grid-pattern text-slate-100 min-h-[92vh] relative select-none overflow-hidden">
      
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-0 w-full h-full ambient-glow-1 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 w-full h-full ambient-glow-2 pointer-events-none z-0" />
      
      {/* 1) SIDEBAR FIXA (DESKTOP) E DRAW RETRÁTIL (MOBILE) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#060713]/85 backdrop-blur-3xl border-r border-[#1d1f39]/50 flex flex-col justify-between transition-all duration-300 transform 
        lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-[8px_0_40px_rgba(139,92,246,0.15)]' : '-translate-x-full lg:sticky lg:top-[53px]'}`}
        style={{ height: 'calc(100vh - 53px)' }}
      >
        <div className="p-6 flex flex-col gap-6">
          {/* Logo da Plataforma Elevado */}
          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/40 to-indigo-950/40 border border-[#8b5cf6]/40 flex items-center justify-center shadow-lg shadow-neon-purple/15 group-hover:border-[#a78bfa]/75 transition-all duration-300">
              <span className="font-display font-black text-2xl text-roxou-neon group-hover:scale-105 transition-transform duration-300 transform">R</span>
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-sm text-white tracking-widest uppercase mt-0.5">ROXOU</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-[#a78bfa] tracking-wider font-extrabold uppercase font-mono">Private Mobility</p>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#20223d] to-transparent w-full" />

          {/* Lista de Navegação Premium */}
          <nav className="flex flex-col gap-1.5">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-200 group relative cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-950/20 to-slate-950/20 text-[#a78bfa] border border-[#3e236b] shadow-[0_4px_20px_rgba(139,92,246,0.06)]'
                      : 'text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-roxou-neon' : 'text-slate-505 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-roxou-purple/20 border border-roxou-purple/40 text-roxou-neon animate-pulse">
                      {item.badge}
                    </span>
                  )}

                  {/* Detalhe de ativação no menu lateral */}
                  {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-roxou-purple rounded shadow-neon-purple" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Informações da Empresa no Rodapé do Menu (Visual de Marca - Mandatório 12) */}
        <div className="p-6 border-t border-[#1a1c32]/50 text-left space-y-2.5 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#8b5cf6]/40" />
            <span className="font-extrabold text-slate-405">Reserva Roxou</span>
          </div>
          <p className="text-[9px] text-[#64668a]">Private Mobility • Powered by Roxou</p>
        </div>
      </aside>

      {/* Overlay do menu mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* 2) CONTEÚDO PRINCIPAL EXPANDIDO */}
      <main className="flex-grow flex flex-col min-w-0 bg-transparent p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">
        
        {/* ==============================================
            TOPO DA PLATAFORMA - TOP BAR PREMIUM ENTERPRISE (LHS)
           ============================================== */}
        <div className="w-full bg-[#050611]/85 backdrop-blur-3xl border border-[#1d1f39]/80 rounded-3xl p-4.5 mb-8 flex flex-col xl:flex-row items-center justify-between gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.55)] relative overflow-hidden">
          {/* Decorative glowing gradient border */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#8b5cf6]/50 to-transparent pointer-events-none" />
          
          {/* Left Block: Logo, Online Status & City Info */}
          <div className="flex items-center gap-4.5 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-3">
              {/* Hamburger Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 bg-[#0a0a16]/90 border border-[#1d1f39]/65 hover:bg-purple-950/35 rounded-xl text-slate-300 lg:hidden cursor-pointer transition-all duration-200 shrink-0"
              >
                {mobileMenuOpen ? <X className="w-4.5 h-4.5 text-roxou-neon" /> : <Menu className="w-4.5 h-4.5" />}
              </button>

              {/* Logo & Operational Slogan */}
              <div 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95] border border-purple-500/60 flex items-center justify-center text-white font-display font-black shadow-[0_0_15px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-all">
                  <span className="text-lg tracking-tighter">R</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black tracking-[0.25em] text-[#a78bfa] font-mono block leading-[1.1] uppercase font-bold">FLEET COMMAND</span>
                  <h1 className="font-display font-black text-sm text-white tracking-widest uppercase block mt-0.5 leading-none group-hover:text-roxou-neon transition-colors">RESERVA ROXOU</h1>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center h-7 w-[1px] bg-[#1d1f39]/50" />

            {/* Live Badges (City, Temp, Online) */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Online Connection Telemetry */}
              <div className="flex items-center gap-2 bg-[#10b981]/5 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] font-mono font-black text-[#10b981] uppercase tracking-wider">SECURE ON-AIR</span>
              </div>

              {/* Geolocation */}
              <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3 h-3 text-roxou-neon shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
                <span className="text-[9px] font-mono font-bold text-slate-350 uppercase tracking-tight">SÃO PAULO • HUB SP</span>
              </div>

              {/* Temperature Info */}
              <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[9px] text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="font-extrabold text-[#f59e0b]">22°C</span>
                <span className="text-slate-600">•</span>
                <span className="uppercase text-slate-300">Céu Limpo</span>
              </div>
            </div>
          </div>

          {/* Right Block: Live Clock, Status Roster & Profile avatar */}
          <div className="flex flex-wrap items-center gap-4.5 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 border-[#1d1f39]/30 pt-3.5 xl:pt-0">
            
            {/* Live Clock with telemetry aesthetics */}
            <div className="hidden md:flex items-center gap-2.5 bg-[#060713]/80 px-4 py-2 border border-[#1d1f39]/65 rounded-xl font-mono text-[10.5px] text-slate-350 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-roxou-neon animate-pulse" />
              <span className="font-extrabold text-[#c084fc]">{currentTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              <span className="text-slate-800">|</span>
              <span className="text-white font-black tracking-widest text-xs">{currentTime.toLocaleTimeString('pt-BR')}</span>
              <span className="text-[7.5px] text-[#22d3ee] font-black">SP NETWORK</span>
            </div>

            {/* Uber Driver availability widget */}
            <div className="bg-[#05050f]/95 border border-[#1d1f39]/65 rounded-xl p-0.8 flex gap-0.8 items-center shadow-lg">
              <button
                onClick={() => handleChangeStatus('online')}
                disabled={updatingStatus || loading}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  driverStatus?.status === 'online'
                    ? 'bg-emerald-500/10 text-[#10b981] border border-emerald-500/30 font-black shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'text-slate-450 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${driverStatus?.status === 'online' ? 'bg-[#10b981] animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-slate-700'}`} />
                <span>ONLINE Chauffeur</span>
              </button>

              <button
                onClick={() => handleChangeStatus('ocupado')}
                disabled={updatingStatus || loading}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  driverStatus?.status === 'ocupado'
                    ? 'bg-[#8b5cf6]/10 text-roxou-neon border border-purple-500/30 font-black'
                    : 'text-slate-450 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${driverStatus?.status === 'ocupado' ? 'bg-[#8b5cf6] animate-pulse' : 'bg-slate-700'}`} />
                <span>EM SERVIÇO</span>
              </button>

              <button
                onClick={() => handleChangeStatus('offline')}
                disabled={updatingStatus || loading}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-120 cursor-pointer ${
                  driverStatus?.status === 'offline'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'text-slate-455 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${driverStatus?.status === 'offline' ? 'bg-slate-500' : 'bg-slate-700'}`} />
                <span>OFFLINE</span>
              </button>
            </div>

            {/* Avatar Profile metadata block */}
            <div className="flex items-center gap-2.5 bg-[#05050f]/80 p-0.5 pr-2.5 rounded-full border border-[#1d1f39]/50 shadow-md">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-650 via-[#c084fc] to-indigo-650 text-white flex items-center justify-center font-black font-display text-xs shadow-inner">
                {currentUser.full_name?.charAt(0) || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[9px] font-black text-slate-100 uppercase tracking-wide leading-none">{currentUser.full_name?.split(' ')[0] || 'Concierge'}</p>
                <span className="text-[7px] text-[#a78bfa] font-mono leading-none tracking-widest font-black uppercase mt-0.5 block">ADMIN COMMAND</span>
              </div>
            </div>
          </div>
        </div>

        {/* O dashboard premium unifica os KPIs e gráficos em uma visualização completa na aba correspondente */}

        {/* 4) RENDERIZAÇÃO ESPECÍFICA DAS SEÇÕES */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-roxou-purple" />
            <span className="text-xs font-medium font-mono">Sincronizando com o Supabase Realtime...</span>
          </div>
        ) : (
          <div className="flex-1 w-full space-y-6">
            
            {/* ==============================================
                A) TAB: DASHBOARD (VISÃO GERAL)
               ============================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 w-full text-left animate-fade-in">
                
                {/* ==============================================
                    1. HERO PLATFORM HEADLINE & VIP METRICS (FULL WIDTH)
                    ============================================== */}
                <div className="w-full bg-gradient-to-br from-[#070715] via-[#04040a] to-[#020205] border border-[#1d1f39] rounded-3xl p-6 lg:p-7.5 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
                  {/* Subtle purple cyber glow indicator */}
                  <div className="absolute top-0 right-0 w-[450px] h-[250px] bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_75%)] pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_60%)] pointer-events-none" />

                  <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 relative z-10">
                    
                    {/* Left Panel: Vehicle Snapshot & Chauffeur Status */}
                    <div className="flex flex-col justify-between max-w-xl">
                      <div>
                        {/* Elite Label */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center justify-center w-5 h-5 bg-[#8b5cf6]/20 border border-purple-500/40 rounded-lg text-roxou-neon">
                            <Activity className="w-3 h-3 animate-pulse" />
                          </div>
                          <span className="text-[10px] font-mono font-black text-[#a78bfa] tracking-widest uppercase">CONCIERGE FLIGHT COMMAND</span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-none text-left">
                          Roxou Private Fleet
                        </h3>
                        
                        {/* Slogan details */}
                        <p className="text-[11.5px] text-slate-400 mt-2.5 leading-relaxed max-w-md text-left">
                          Serviço Premium Black Car de escala corporativa. Coordenação tática terrestre de motoristas executivos credenciados, recepção VIP em aeroportos e faturas em tempo real.
                        </p>
                      </div>

                      {/* Active Vehicle & City Geotag specs */}
                      <div className="mt-5.5 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Mini Spec 1: Car Selection */}
                        <div className="bg-[#050510]/95 border border-[#1d1f39]/80 p-2.5 rounded-xl text-left">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block font-extrabold tracking-wider">Veículo do Turno</span>
                          <span className="text-[10px] text-white font-black truncate block mt-0.5">Audi A8 L Executive</span>
                        </div>

                        {/* Mini Spec 2: Armored Info */}
                        <div className="bg-[#050510]/95 border border-[#1d1f39]/80 p-2.5 rounded-xl text-left">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block font-extrabold tracking-wider">Proteção Balística</span>
                          <span className="text-[10px] text-emerald-450 font-black block mt-0.5">Blindagem III-A Certified</span>
                        </div>

                        {/* Mini Spec 3: Chauffeur ID */}
                        <div className="bg-[#050510]/95 border border-[#1d1f39]/80 p-2.5 rounded-xl text-left col-span-2 md:col-span-1">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block font-extrabold tracking-wider">ANTT Autorização</span>
                          <span className="text-[10px] text-roxou-neon font-mono font-black block mt-0.5">SP-992-B-HQ</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Premium Interactive Mobility Telemetry metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 flex-grow lg:max-w-4xl">
                      
                      {/* Metric 1 - Receita Executiva Diária */}
                      <div className="bg-[#050510]/95 border border-[#1d1f39]/90 hover:border-purple-500/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-200 group text-left">
                        <div className="absolute top-0 right-0 h-1 bg-[#10b981]" />
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest font-mono">Receita Realizada</span>
                          <span className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-mono text-[7px] font-black animate-pulse">● LIVE</span>
                        </div>
                        <div className="mt-3.5 text-left">
                          <p className="text-2xl font-display font-black text-white tracking-tight leading-none group-hover:text-roxou-neon transition-colors">
                            {formatCurrency(totalTodayEarnings || 380)}
                          </p>
                          <span className="text-[8px] font-mono text-slate-500 font-extrabold mt-1.5 inline-block uppercase">
                            DIÁRIO • {todayConcludedRides.length} CONFIRMADAS
                          </span>
                        </div>
                      </div>

                      {/* Metric 2 - Frota Reservas do Dia */}
                      <div className="bg-[#050510]/95 border border-[#1d1f39]/90 hover:border-purple-500/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-200 group text-left">
                        <div className="absolute top-0 right-0 h-1 bg-[#8b5cf6]" />
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest font-mono">Reservas de Hoje</span>
                          <Calendar className="w-3 h-3 text-[#a78bfa] shrink-0" />
                        </div>
                        <div className="mt-3.5 text-left">
                          <p className="text-2xl font-display font-black text-white tracking-tight leading-none">
                            {todayRides.length || 2}
                          </p>
                          <span className="text-[8px] font-mono text-roxou-neon font-extrabold mt-1.5 inline-block uppercase">
                            {todayConcludedRides.length} / {todayRides.length} EXECUTADAS
                          </span>
                        </div>
                      </div>

                      {/* Metric 3 - Chauffeur Rating Score */}
                      <div className="bg-[#050510]/95 border border-[#1d1f39]/90 hover:border-purple-500/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-200 group text-left">
                        <div className="absolute top-0 right-0 h-1 bg-amber-500" />
                        <div className="flex justify-between items-start">
                          <span className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest font-mono">Índice Qualidade</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="mt-3.5 text-left">
                          <p className="text-2xl font-display font-black text-[#f59e0b] tracking-tight leading-none">
                            4.98 <span className="text-[11px] text-slate-450 font-medium font-sans">/ 5.0</span>
                          </p>
                          <span className="text-[8px] font-mono text-emerald-450 font-extrabold mt-1.5 inline-block uppercase">
                            ★ EXCELÊNCIA RATING
                          </span>
                        </div>
                      </div>

                      {/* Metric 4 - Próxima Viagem Monitorada */}
                      <div className="bg-[#050510]/95 border border-[#1d1f39]/90 hover:border-purple-500/40 p-4.5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-200 group text-left sm:col-span-2 lg:col-span-1">
                        <div className="absolute top-0 right-0 h-1 bg-cyan-500" />
                        <div className="flex justify-between items-start">
                          <span className="text-[#22d3ee] text-[9px] font-extrabold uppercase tracking-widest font-mono">Próxima Saída</span>
                          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        </div>
                        
                        <div className="mt-3.5 text-left">
                          {nextRide ? (
                            <div 
                              onClick={() => navigate(`/reserva/${nextRide.id}`)} 
                              className="cursor-pointer hover:opacity-85 transition-opacity"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white font-mono">{nextRide.scheduled_time}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-[9px] text-roxou-neon font-extrabold uppercase tracking-widest truncate max-w-[85px]">
                                  {nextRide.profiles?.full_name?.split(' ')[0] || 'VIP'}
                                </span>
                              </div>
                              <p className="text-[8.5px] text-slate-400 truncate mt-1">
                                {nextRide.origin.split(',')[0]} ➔ {nextRide.destination.split(',')[0]}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-[11px] font-extrabold text-slate-400">Status Estável</p>
                              <span className="text-[8px] font-mono text-slate-550 mt-1 inline-block uppercase">Sem saídas atômicas</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 2. GRANDE CARD CENTRAL DE OPERAÇÃO DO DIA E MAPA OPERACIONAL */}
                <div className="bg-[#050611]/20 border border-[#1d1f39]/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-[#1d1f39]/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#c084fc]" />
                        <h3 className="font-display font-bold text-lg md:text-xl text-white">Central de Operação de Tráfego</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Painel aeroespacial de rastreio de motoristas executivos e controle do percurso de passageiros VIP.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-slate-550 uppercase">Visual:</span>
                      <div className="bg-slate-950 px-3 py-1 rounded-full text-[9.5px] font-mono font-bold text-roxou-neon border border-purple-550/20 shadow-inner">
                        ● MAPA DINÂMICO DE VETORES
                      </div>
                      <div className="bg-slate-950 px-3 py-1 rounded-full text-[9.5px] font-mono font-bold text-[#3a86ff] border border-blue-550/20 shadow-inner">
                        ESTIMATING ETA: ACTIVE
                      </div>
                    </div>
                  </div>

                  {/* Grid de Operação Central (Mapa + Próximas Saídas) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* LHS: 3D-Like stylized Vector Map (Mapa Operacional) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                      
                      {/* Stylized vector map container */}
                      <div className="w-full h-80 bg-[#040510] rounded-2xl relative overflow-hidden border border-[#2d2f4d]/50 shadow-inner group">
                        
                        {/* Background Grid Pattern Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
                        
                        {/* Interactive HUD Map Viewport */}
                        <svg viewBox="0 0 800 400" className="w-full h-full object-cover">
                          <defs>
                            <linearGradient id="execRouteGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                              <stop offset="50%" stopColor="#c084fc" stopOpacity="1" />
                              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                            </linearGradient>
                            
                            <radialGradient id="vehicleRadarPulse" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                            </radialGradient>
                          </defs>

                          {/* Map Streets / Highway Lines */}
                          <path d="M 30 180 Q 250 140, 410 260 T 770 200" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" strokeLinecap="round" />
                          <path d="M 80 40 L 80 360" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="2" />
                          <path d="M 720 40 L 720 360" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="2" />
                          <path d="M 120 300 Q 350 250, 520 280 T 780 320" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="4" />
                          <path d="M 380 40 L 450 360" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1.5" />

                          {/* ACTIVE VIP SERVICE ROUTE (Hotel Unique -> Congonhas Airport / CGH) */}
                          <path 
                            d="M 180 280 Q 320 160, 480 200 T 690 140" 
                            fill="none" 
                            stroke="url(#execRouteGradient)" 
                            strokeWidth="4" 
                            strokeLinecap="round" 
                            strokeDasharray="8,8" 
                            className="animate-[dash_12s_linear_infinite]" 
                          />

                          {/* Nodes / Landmark Indicators */}
                          {/* Node: Faria Lima Base (Unique Location) */}
                          <g className="cursor-pointer">
                            <circle cx="180" cy="280" r="14" fill="#040510" stroke="#8b5cf6" strokeWidth="2" />
                            <circle cx="180" cy="280" r="4.5" fill="#c084fc" />
                            <text x="180" y="310" fill="#a78bfa" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" className="tracking-wider">FARIA LIMA BASE</text>
                          </g>

                          {/* Node: CGH Airport */}
                          <g className="cursor-pointer">
                            <circle cx="690" cy="140" r="18" fill="#040510" stroke="#22d3ee" strokeWidth="2" />
                            <circle cx="690" cy="140" r="5" fill="#22d3ee" className="animate-pulse" />
                            <text x="690" y="172" fill="#22d3ee" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" className="tracking-wider">AEROPORTO CGH</text>
                          </g>

                          {/* Node: GRU Executive Terminal */}
                          <g className="cursor-pointer">
                            <circle cx="480" cy="200" r="12" fill="#040510" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            <circle cx="480" cy="200" r="3" fill="#94a3b8" />
                            <text x="480" y="225" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">GRU T3 VIP</text>
                          </g>

                          {/* Active Vehicle Marker (Luxury Dark BMW Sedan) */}
                          <g transform="translate(385, 185)" className="cursor-pointer">
                            <circle cx="0" cy="0" r="20" fill="url(#vehicleRadarPulse)" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                            <circle cx="0" cy="0" r="7.5" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
                            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
                          </g>
                        </svg>

                        {/* Top Left Overlay HUD Badge */}
                        <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-[#1d1f39]/80 px-3 py-2 rounded-xl text-left select-none font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse" />
                            <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest">REAL-TIME TRANSMITTER</span>
                          </div>
                          
                          <p className="text-white text-xs font-black mt-1">AUDI A8 VIP L</p>
                          <span className="text-[8.5px] text-slate-400">PREFIX: ROX-8822 (Motorista: Carlos)</span>
                        </div>

                        {/* Bottom Right Telemetry Box */}
                        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-[#1d1f39]/80 p-3.5 rounded-xl text-left w-60 pointer-events-none select-none font-mono text-[9px] shadow-2xl">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-roxou-neon font-bold uppercase tracking-wider text-[8px]">TELEMETRIA ATIVA</span>
                            <span className="text-[8px] bg-purple-950 text-roxou-neon font-bold px-1 py-0.2 rounded font-mono">ON ROAD</span>
                          </div>
                          
                          <div className="h-[1px] bg-white/[0.06] mb-1.5" />
                          
                          <div className="space-y-1 text-slate-300">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Velocidade:</span>
                              <span className="text-white font-extrabold">64 km/h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Localização atual:</span>
                              <span className="text-white truncate max-w-[120px]">Av. Brasil, SP</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Distância percorrida:</span>
                              <span className="text-white font-bold">8.4 km / 14.8 km</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-white/[0.04]">
                              <span className="text-roxou-neon font-black">ETA DESTINO:</span>
                              <span className="text-roxou-neon font-black text-[10.5px]">11 min (CGH)</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Small Luxury Car Asset Illustrative Widget */}
                      <div className="p-4 bg-[#0a0b16]/75 border border-[#1d1f39]/50 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-purple-950/20 border border-[#8b5cf6]/25 flex items-center justify-center">
                            <Car className="w-6 h-6 text-roxou-neon" />
                          </div>
                          <div className="text-left">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">FROTA PREMIUM DISPONÍVEL</span>
                            <h4 className="text-sm font-black text-white leading-tight">Sedans e SUVs Corporativos</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Veículos blindados executivos higienizados com ar trizone, Wi-Fi e carregador.</p>
                          </div>
                        </div>

                        <div className="text-right hidden sm:block">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold block">100% BLINDADOS</span>
                          <span className="text-[9px] text-slate-500 block font-semibold uppercase mt-0.5">SEGURANÇA CORPORATIVA</span>
                        </div>
                      </div>

                    </div>

                    {/* RHS: Próximas Reservas (Estilo Uber Driver Executivo) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between">
                      <div className="bg-[#050611]/85 border border-[#1d1f39]/50 rounded-2xl p-4.5 text-left flex flex-col justify-between h-full min-h-[360px]">
                        
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-roxou-neon" />
                              <h4 className="font-display font-bold text-sm text-slate-100">Próximas Escalas</h4>
                            </div>
                            
                            <span className="text-[9.5px] bg-[#8b5cf6]/10 text-roxou-neon font-bold px-2 py-0.5 rounded-md font-mono">
                              FILA ({rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem').length})
                            </span>
                          </div>

                          <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                            {rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem').length === 0 ? (
                              <div className="p-8 rounded-2xl border border-[#1d1f39]/50 border-dashed text-center text-slate-500 text-[11px] leading-relaxed">
                                Nenhuma viagem executiva reservada nas próximas 12 horas.
                              </div>
                            ) : (
                              rides
                                .filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem')
                                .slice(0, 4)
                                .map(ride => {
                                  // Fake mileage and ETA for visual mobility realism
                                  const mockedDist = (ride.estimated_price ? (ride.estimated_price / PRICING_CONFIG.pricePerKm).toFixed(1) : "15.4");
                                  const rideHour = ride.scheduled_time || "14:00";
                                  const statusColor = ride.status === 'em_viagem' ? 'border-emerald-505 bg-emerald-500/10 text-emerald-400' : 'border-purple-500/35 bg-purple-950/20 text-[#c084fc]';
                                  
                                  return (
                                    <div
                                      key={ride.id}
                                      onClick={() => navigate(`/reserva/${ride.id}`)}
                                      className="bg-[#0b0c1e] hover:bg-purple-950/10 p-3.5 rounded-2xl border border-[#1d1f39]/65 flex flex-col justify-between gap-3 transition-all cursor-pointer group hover:border-[#8b5cf6]/50 relative"
                                    >
                                      {/* Header of appointment */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white font-mono flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-roxou-neon shrink-0" />
                                          {formatFriendlyDate(ride.scheduled_date)} às {rideHour}
                                        </span>

                                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusColor}`}>
                                          {ride.status === 'em_viagem' ? 'EM VIAGEM' : 'AGENDADO'}
                                        </span>
                                      </div>

                                      {/* Transportation visual route line */}
                                      <div className="text-[11px] font-semibold text-slate-350 space-y-1.5 relative border-l border-slate-800 ml-2 pl-3">
                                        <div className="relative">
                                          <span className="absolute -left-[16px] top-1 w-2 h-2 rounded-full bg-slate-500" />
                                          <p className="text-slate-400 font-medium truncate" title={ride.origin}>
                                            <strong className="text-white">ORIGEM:</strong> {ride.origin.split(',')[0]}
                                          </p>
                                        </div>
                                        <div className="relative">
                                          <span className="absolute -left-[16px] top-1 w-2 h-2 rounded-full bg-roxou-neon shadow-[0_0_6px_#c084fc]" />
                                          <p className="text-slate-405 truncate" title={ride.destination}>
                                            <strong className="text-white">DESTINO:</strong> {ride.destination.split(',')[0]}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Mileage / Passenger details */}
                                      <div className="flex justify-between items-center pt-2.5 border-t border-[#1d1f39]/40 text-[9.5px]">
                                        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                                          <Map className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                                          <span>{mockedDist} km</span>
                                        </div>

                                        <div className="text-right">
                                          <span className="text-white font-black font-mono leading-none block">
                                            {formatCurrency(ride.estimated_price || ride.final_price)}
                                          </span>
                                          <span className="text-[7.5px] text-slate-500 uppercase font-bold block mt-0.5">TARIFA EXEC VIP</span>
                                        </div>
                                      </div>

                                      {/* Interactive Hover indicator */}
                                      <span className="absolute right-2 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-roxou-neon flex items-center font-bold">
                                        DESPACHAR <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-0.5" />
                                      </span>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>

                        {/* Instant scheduling driver shortcuts */}
                        <div className="mt-4 pt-3 border-t border-[#1d1f39]/30">
                          <button
                            onClick={() => navigate('/admin/agenda')}
                            className="w-full py-2.5 bg-[#0a0a16] hover:bg-purple-950/20 text-slate-350 hover:text-white border border-[#1d1f39]/50 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-inner"
                          >
                            <span>Acessar Painel Executivo da Agenda</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. TERCEIRA SEÇÃO: CONTROLE DE CLIENTES PREMIUM & OUTRAS ANÁLISES */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                  
                  {/* LHS: Clientes Corporativos Recentes Premium Cards CRM */}
                  <div className="xl:col-span-8 bg-[#050611]/60 border border-[#1d1f39]/50 rounded-3xl p-6 text-left flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.1),transparent_70%)] pointer-events-none" />

                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-roxou-neon" />
                          <div>
                            <h4 className="font-display font-black text-base text-slate-100 uppercase tracking-wide">Base de Passageiros Corporativos VIP</h4>
                            <p className="text-[10.5px] text-slate-450 mt-0.5">Contas selecionadas com faturamento corporativo consolidado mensal.</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setSearchQuery(''); 
                            // Navegar para Clientes
                            const tabBtn = document.querySelector('[data-tab="clientes"]') as HTMLButtonElement;
                            if (tabBtn) tabBtn.click();
                          }}
                          className="text-[10px] uppercase font-mono font-bold text-roxou-neon bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/35 rounded-xl px-3 py-1.5 transition-all select-none"
                        >
                          Gerenciar CRM Completo
                        </button>
                      </div>

                      {/* Display as premium cards layout (Uber Driver - VIP Style) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Dynamic Rendered client accounts */}
                        {clientsData.slice(0, 4).map((client, idx) => {
                          const clientInitials = client.name.charAt(0);
                          const mockCorp = idx === 0 ? "ITAÚ PRIVATE BANK" : idx === 1 ? "SAFRA MULTIFAMILY" : "CORPORATE CO.";
                          return (
                            <div 
                              key={client.id || idx} 
                              className="bg-[#030308]/90 hover:bg-[#060714] border border-[#1d1f39]/90 hover:border-[#8b5cf6]/50 p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden group shadow-lg"
                            >
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
                              
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#c084fc]/15 border border-[#8b5cf6]/30 text-roxou-neon flex items-center justify-center font-display font-black text-sm shrink-0 shadow-inner">
                                  {clientInitials}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-display font-bold text-sm text-white truncate text-left">{client.name}</h5>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 text-roxou-neon px-1.5 py-0.2 rounded font-mono font-black uppercase tracking-wider">
                                      {mockCorp}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#0a0a14]/65 border border-white/[0.04] p-3 rounded-xl grid grid-cols-2 gap-2 text-left font-mono">
                                <div>
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Viagens Ativas</span>
                                  <span className="text-xs text-white font-black">{client.tripsCount || 1} • Executando</span>
                                </div>
                                <div className="text-right border-l border-white/[0.04] pl-2">
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Volume Faturado</span>
                                  <span className="text-xs text-emerald-400 font-black">{formatCurrency(client.totalSpent || 250)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                                <span className="text-[9px] text-[#a78bfa] font-mono lowercase truncate max-w-[130px]">{client.email}</span>
                                <button
                                  onClick={() => {
                                    alert(`Envio de fatura em tempo real via canal de faturamento para ${client.name} iniciado.`);
                                  }}
                                  className="text-[8px] font-mono uppercase bg-[#10b981]/15 hover:bg-[#10b981]/25 text-emerald-400 font-extrabold px-2.5 py-1 rounded border border-[#10b981]/30 transition-all cursor-pointer shadow-sm ml-auto"
                                >
                                  Fatura Express
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Complete with fixed premium luxury context cards to look like Wheely Enterprise */}
                        {clientsData.length < 3 && (
                          <>
                            {/* Chauffeur Card 1: Roberta */}
                            <div className="bg-[#030308]/90 hover:bg-[#060714] border border-[#1d1f39]/90 hover:border-[#8b5cf6]/50 p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden group shadow-lg">
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
                              
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-display font-black text-sm shrink-0 shadow-inner">
                                  R
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-display font-bold text-sm text-white truncate text-left">Roberta Drummond</h5>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] bg-amber-550/10 border border-amber-550/20 text-amber-400 px-1.5 py-0.2 rounded font-mono font-black uppercase tracking-wider">
                                      CONSELHO BANCO BTG
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#0a0a14]/65 border border-white/[0.04] p-3 rounded-xl grid grid-cols-2 gap-2 text-left font-mono">
                                <div>
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Viagens Ativas</span>
                                  <span className="text-xs text-white font-black">14 • Executadas</span>
                                </div>
                                <div className="text-right border-l border-white/[0.04] pl-2">
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Valores Mensais</span>
                                  <span className="text-xs text-emerald-400 font-black">R$ 2.450,00</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                                <span className="text-[9px] text-[#a78bfa] font-mono lowercase truncate">roberta.drummond@btg.com.br</span>
                                <span className="text-[8.5px] text-amber-400 font-mono uppercase bg-amber-950/20 border border-amber-500/35 px-2 py-0.5 rounded-lg font-bold ml-auto select-none">CONTA VIP</span>
                              </div>
                            </div>

                            {/* Chauffeur Card 2: Murillo */}
                            <div className="bg-[#030308]/90 hover:bg-[#060714] border border-[#1d1f39]/90 hover:border-[#8b5cf6]/50 p-4 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-300 relative overflow-hidden group shadow-lg">
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
                              
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/15 border border-[#8b5cf6]/35 text-[#c084fc] flex items-center justify-center font-display font-black text-sm shrink-0 shadow-inner">
                                  M
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-display font-bold text-sm text-white truncate text-left">Murillo Sales de Toledo</h5>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] bg-sky-500/10 border border-sky-505/20 text-sky-450 px-1.5 py-0.2 rounded font-mono font-black uppercase tracking-wider">
                                      CEAG XP SEGUROS
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#0a0a14]/65 border border-white/[0.04] p-3 rounded-xl grid grid-cols-2 gap-2 text-left font-mono">
                                <div>
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Viagens Ativas</span>
                                  <span className="text-xs text-white font-black">9 • Executadas</span>
                                </div>
                                <div className="text-right border-l border-white/[0.04] pl-2">
                                  <span className="text-[7.5px] text-slate-500 uppercase font-extrabold tracking-wider block">Valores Mensais</span>
                                  <span className="text-xs text-emerald-400 font-black">R$ 1.890,50</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                                <span className="text-[9px] text-[#a78bfa] font-mono lowercase truncate">mtoledo@xpinc.com.br</span>
                                <span className="text-[8.5px] text-[#c084fc] font-mono uppercase bg-purple-950/20 border border-purple-550/35 px-2 py-0.5 rounded-lg font-bold ml-auto select-none">CONTA VIP</span>
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* RHS: Gráfico Financeiro stacked with Rotas Frequentes */}
                  <div className="xl:col-span-4 flex flex-col gap-6">
                    
                    {/* Gráfico Financeiro Premium area path em SVG */}
                    <div className="bg-[#050611]/60 border border-[#1d1f39]/50 rounded-3xl p-6 flex flex-col justify-between text-left shadow-md">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">Consolidado Financeiro Histórico</h4>
                          <p className="text-[10px] text-slate-400">Receita executiva anual de semestres compilados</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-805 px-2.5 py-1 rounded-xl font-mono text-[9.5px] text-[#a78bfa]">
                          R$ Histórico: {formatCurrency(totalConcludedEarnings)}
                        </div>
                      </div>

                      {/* SVG Vector Chart Line with areas & glowing nodes */}
                      <div className="w-full h-32 relative">
                        <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00" />
                            </linearGradient>
                          </defs>
                          {/* Horizontal Grid lines */}
                          <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />
                          <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3,3" />
                          
                          {/* Shaded Area */}
                          <path d="M0 160 Q 80 140, 150 115 Q 220 85, 290 120 Q 360 140, 430 75 L 500 45 L 500 200 L 0 200 Z" fill="url(#chartGradientDashboard)" />
                          
                          {/* Glow indicator line */}
                          <path d="M0 160 Q 80 140, 150 115 Q 220 85, 290 120 Q 360 140, 430 75 L 500 45" fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]" />
                          
                          {/* Glowing node circles */}
                          <circle cx="150" cy="115" r="4" fill="#a78bfa" stroke="#040510" strokeWidth="1.5" />
                          <circle cx="290" cy="120" r="4" fill="#a78bfa" stroke="#040510" strokeWidth="1.5" />
                          <circle cx="430" cy="75" r="4" fill="#22d3ee" stroke="#040510" strokeWidth="1.5" className="animate-pulse" />
                          <circle cx="500" cy="45" r="4.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="1.5" />
                        </svg>
                      </div>

                      <div className="flex justify-between font-mono text-[8px] text-slate-500 uppercase mt-3">
                        <span>Jan/Mar</span>
                        <span>Abr/Jun</span>
                        <span>Jul/Set</span>
                        <span className="text-roxou-neon font-bold">Hoje/Dez</span>
                      </div>
                    </div>

                    {/* Destinos Populares / Frequent Routes */}
                    <div className="bg-[#050611]/60 border border-[#1d1f39]/50 rounded-3xl p-6 text-left flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-100 mb-1">Rotas Premium Recorrentes</h4>
                        <p className="text-[10px] text-slate-500">Regiões corporativas com maior incidência de viagens fechadas</p>
                      </div>

                      <div className="space-y-3 mt-4">
                        {topDestinations.map((dest, idx) => {
                          const percents = [85, 65, 45, 25];
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold">
                                <span className="text-slate-300 truncate pr-2 font-medium">{dest.name}</span>
                                <span className="text-roxou-neon font-mono text-[9.5px] font-bold">{dest.value} corridas</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/[0.02]">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-650 to-roxou-neon rounded-full"
                                  style={{ width: `${percents[idx] || 15}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* ==============================================
                B) TAB: SOLICITAÇÕES (KANBAN)
               ============================================== */}
            {activeTab === 'solicitacoes' && (
              <div className="space-y-6 text-left animate-fade-in">
                {/* Cabeçalho do Kanban */}
                <div className="p-4 bg-[#060713]/45 backdrop-blur-md border border-[#1d1f39]/55 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-md">
                  <div className="text-left">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Gerencie as propostas corporativas de translados e viagens em tempo real e de forma prática. <br />
                      <strong>Dica Avançada:</strong> Arraste e solte (Drag &amp; Drop) os cartões entre as colunas para atualizar seu andamento instantaneamente, ou use as opções de cliques rápidos.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#6d7199] font-mono uppercase">Sincronização:</span>
                    <button
                      onClick={loadData}
                      className="p-2.5 bg-[#0a0a16]/80 hover:bg-purple-950/20 border border-[#1d1f39]/50 rounded-xl text-slate-300 transition-all cursor-pointer shadow-inner"
                      title="Forçar recarga"
                    >
                      <RefreshCw className="w-4 h-4 text-[#a78bfa]" />
                    </button>
                  </div>
                </div>

                {/* Kanban Board Columns View */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 overflow-x-auto pb-4 items-start select-none">
                  
                  {/* Coluna 1: Pendentes (Orçamento Novo) */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'pendente')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'pendente')}
                    className={`bg-[#060713]/30 backdrop-blur-md border rounded-2xl p-4 flex flex-col gap-4 min-h-[500px] transition-all duration-300 ${
                      draggedOverCol === 'pendente' ? 'border-[#8b5cf6] bg-[#8b5cf6]/5 scale-[1.01]' : 'border-[#1d1f39]/55 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-[#1d1f39]/30 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="font-display font-extrabold text-xs uppercase tracking-wider text-yellow-400">Pendentes</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-yellow-950/40 border border-yellow-500/20 text-yellow-405 text-[10px] font-bold font-mono">
                        {rides.filter(r => r.status === 'pendente').length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {rides.filter(r => r.status === 'pendente').length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-10 font-medium">Sem orçamentos pendentes.</p>
                      ) : (
                        rides.filter(r => r.status === 'pendente').map(ride => (
                          <div
                            key={ride.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ride.id)}
                            className="active:cursor-grabbing cursor-grab"
                          >
                            <RideCard ride={ride} isAdminView={true} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coluna 2: Aguardando Cliente (Aprovado / Pendente Pagamento) */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'aprovado')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'aprovado')}
                    className={`bg-[#0d0e1b] border rounded-2xl p-4 flex flex-col gap-4 min-h-[500px] transition-all ${
                      draggedOverCol === 'aprovado' ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' : 'border-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="font-display font-extrabold text-xs uppercase tracking-wider text-indigo-405">Aguardando Cliente</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 text-[10px] font-bold font-mono">
                        {rides.filter(r => r.status === 'aprovado').length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {rides.filter(r => r.status === 'aprovado').length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-10 font-medium">Sem reservas aguardando aceitação.</p>
                      ) : (
                        rides.filter(r => r.status === 'aprovado').map(ride => (
                          <div
                            key={ride.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ride.id)}
                            className="active:cursor-grabbing cursor-grab"
                          >
                            <RideCard ride={ride} isAdminView={true} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coluna 3: Confirmadas / Em Viagem (Agendadas) */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'confirmado_reserva')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'confirmado_reserva')}
                    className={`bg-[#0d0e1b] border rounded-2xl p-4 flex flex-col gap-4 min-h-[500px] transition-all ${
                      draggedOverCol === 'confirmado_reserva' ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]' : 'border-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-450 shadow-neon-green" />
                        <span className="font-display font-extrabold text-xs uppercase tracking-wider text-emerald-405">Confirmadas</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 text-[10px] font-bold font-mono">
                        {rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem' || r.status === 'confirmado_pagamento').length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem' || r.status === 'confirmado_pagamento').length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-10 font-medium">Sem confirmados pendentes de saída.</p>
                      ) : (
                        rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'em_viagem' || r.status === 'confirmado_pagamento').map(ride => (
                          <div
                            key={ride.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ride.id)}
                            className="active:cursor-grabbing cursor-grab"
                          >
                            <RideCard ride={ride} isAdminView={true} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coluna 4: Finalizadas */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'concluido')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'concluido')}
                    className={`bg-[#0d0e1b] border rounded-2xl p-4 flex flex-col gap-4 min-h-[500px] transition-all ${
                      draggedOverCol === 'concluido' ? 'border-purple-550 bg-purple-550/5 scale-[1.01]' : 'border-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-400">Finalizadas</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-bold font-mono">
                        {rides.filter(r => r.status === 'concluido').length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {rides.filter(r => r.status === 'concluido').length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-10 font-medium">Nenhuma concluída.</p>
                      ) : (
                        rides.filter(r => r.status === 'concluido').slice(0, 10).map(ride => (
                          <div
                            key={ride.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ride.id)}
                            className="active:cursor-grabbing cursor-grab"
                          >
                            <RideCard ride={ride} isAdminView={true} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Coluna 5: Canceladas / Recusadas */}
                  <div
                    onDragOver={(e) => handleDragOver(e, 'cancelado')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'cancelado')}
                    className={`bg-[#0d0e1b] border rounded-2xl p-4 flex flex-col gap-4 min-h-[500px] transition-all ${
                      draggedOverCol === 'cancelado' ? 'border-rose-950 bg-rose-950/20 scale-[1.01]' : 'border-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-display font-extrabold text-xs uppercase tracking-wider text-rose-500">Canceladas</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-950/45 text-rose-500 text-[10px] font-bold font-mono">
                        {rides.filter(r => r.status === 'cancelado' || r.status === 'recusado').length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {rides.filter(r => r.status === 'cancelado' || r.status === 'recusado').length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-10 font-medium">Nenhum descarte.</p>
                      ) : (
                        rides.filter(r => r.status === 'cancelado' || r.status === 'recusado').slice(0, 10).map(ride => (
                          <div
                            key={ride.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, ride.id)}
                            className="active:cursor-grabbing cursor-grab"
                          >
                            <RideCard ride={ride} isAdminView={true} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ==============================================
                C) TAB: AGENDA VISUAL (GOOGLE CALENDAR ESTILO)
               ============================================== */}
            {activeTab === 'agenda' && (
              <div className="space-y-6 text-left animate-fade-in">
                {/* Header & Seleção de Abas do Calendário */}
                <div className="bg-[#0f1020] border border-slate-900 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-100">Escala de Translados Confirmados</h3>
                    <p className="text-xs text-slate-450 mt-1">Horários de saída e motoristas sincronizados para as próximas datas</p>
                  </div>
                  
                  {/* Selector Google Calendar Estilo */}
                  <div className="bg-slate-950 border border-slate-900 p-1 rounded-xl flex gap-1 self-stretch sm:self-auto justify-between">
                    <button
                      onClick={() => setAgendaTab('hoje')}
                      className={`px-4 py-1.8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        agendaTab === 'hoje' ? 'bg-roxou-purple text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setAgendaTab('amanha')}
                      className={`px-4 py-1.8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        agendaTab === 'amanha' ? 'bg-roxou-purple text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Amanhã
                    </button>
                    <button
                      onClick={() => setAgendaTab('semana')}
                      className={`px-4 py-1.8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        agendaTab === 'semana' ? 'bg-roxou-purple text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Semana toda
                    </button>
                  </div>
                </div>

                {/* Linha do Tempo / Timeline Layout */}
                {agendaRides.length === 0 ? (
                  <div className="bg-[#0f1020] border border-slate-900 p-12 rounded-3xl text-center text-slate-500 space-y-4 max-w-xl mx-auto">
                    <Calendar className="w-12 h-12 text-slate-655 mx-auto opacity-70" />
                    <div>
                      <h4 className="font-semibold text-slate-400 text-sm">Nenhum translado agendado</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                        Para o período selecionado ("{agendaTab.toUpperCase()}"), não há viagens na agenda. Use o Painel de Solicitações para aprovar orçamentos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Linha cronológica das viagens agrupadas */}
                    {agendaRides.map((ride, index) => {
                      const showHeader = index === 0 || agendaRides[index - 1].scheduled_date !== ride.scheduled_date;
                      return (
                        <div key={ride.id} className="space-y-3">
                          {showHeader && (
                            <div className="flex items-center gap-2 pt-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-roxou-purple shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                              <span className="font-display font-black text-xs uppercase tracking-widest text-[#a78bfa]">
                                {formatFriendlyDate(ride.scheduled_date)}
                              </span>
                              <div className="h-[1px] flex-grow bg-slate-900/60" />
                            </div>
                          )}

                          {/* Linha de compromisso estilo Horário de Clínicas */}
                          <div
                            onClick={() => navigate(`/reserva/${ride.id}`)}
                            className="bg-[#0f1020] border border-slate-900 p-5 rounded-2xl hover:border-roxou-purple/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer relative group pl-7"
                          >
                            {/* Borda lateral colorida de compromisso */}
                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-roxou-purple to-indigo-500 rounded-r-md" />

                            <div className="flex flex-col md:flex-row gap-4 items-start select-text min-w-0 flex-1">
                              {/* Horário em destaque */}
                              <div className="flex items-center gap-2 font-mono text-sm font-bold text-white shrink-0">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="bg-slate-950 px-2 py-1 rounded-lg border border-slate-900 text-roxou-neon">
                                  {ride.scheduled_time}
                                </span>
                              </div>

                              {/* Origem e Destino do Translado */}
                              <div className="text-left font-display min-w-0 flex-1 leading-relaxed">
                                <div className="flex items-center gap-2 font-mono text-[9px] text-slate-520 uppercase select-all tracking-wider font-semibold">
                                  <span>#{ride.id.split('-')[0].toUpperCase()}</span>
                                  <span>•</span>
                                  <span>{ride.passenger_count} passageiros</span>
                                </div>
                                <p className="text-xs text-slate-350 truncate mt-1">
                                  <strong className="text-white">A: </strong> {ride.origin}
                                </p>
                                <p className="text-xs text-slate-350 truncate">
                                  <strong className="text-roxou-neon font-bold">B: </strong> {ride.destination}
                                </p>
                              </div>
                            </div>

                            {/* Informações Comerciais */}
                            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto self-stretch md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-900/40">
                              <div className="text-left md:text-right shrink-0">
                                <span className="text-[9px] text-slate-520 block uppercase tracking-wider font-semibold">Valor Fechado</span>
                                <span className="font-display font-black text-sm text-white select-all">
                                  {formatCurrency(ride.final_price || ride.estimated_price)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                                  ride.status === 'em_viagem' 
                                    ? 'bg-purple-950/20 text-purple-400 border-purple-900/10 animate-pulse'
                                    : 'bg-emerald-950/20 text-emerald-400 border-emerald-990/10'
                                }`}>
                                  {ride.status === 'em_viagem' ? 'Em Trânsito' : 'Na Agenda'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================
                D) TAB: CLIENTES (TABELA PROFISSIONAL)
               ============================================== */}
            {activeTab === 'clientes' && (
              <div className="space-y-6 text-left animate-fade-in">
                {/* Cabeçalho da Base de Clientes */}
                <div className="bg-[#0f1020] border border-slate-900 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="text-left">
                    <h3 className="font-display font-bold text-base text-slate-100">Base Sincronizada de Clientes Corporativos</h3>
                    <p className="text-xs text-slate-450 mt-1">Registros de gastos acumulados e translados executivos liquidados por passageiro</p>
                  </div>

                  {/* Input de Busca Rápida */}
                  <div className="relative w-full md:w-80">
                    <Search className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar cliente ou e-mail..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-roxou-purple text-slate-200 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Tabela de Dados Corporativos */}
                <div className="bg-[#0f1020] border border-slate-900 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] text-slate-400 uppercase tracking-widest font-black font-mono">
                          <th className="py-4 px-6">Nome / Cadastro</th>
                          <th className="py-4 px-6">Contato</th>
                          <th className="py-4 px-6 md:text-center">Viagens Solicitadas</th>
                          <th className="py-4 px-6">Última Saída</th>
                          <th className="py-4 px-6 text-right">Faturado Concluído</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                        {filteredClients.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 px-6 text-center text-slate-505 font-mono">
                              Nenhum cliente para exibir no momento.
                            </td>
                          </tr>
                        ) : (
                          filteredClients.map((client, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30 transition-all">
                              <td className="py-4.5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-roxou-purple/10 border border-roxou-purple/20 flex items-center justify-center font-bold text-roxou-neon uppercase">
                                    {client.name.charAt(0)}
                                  </div>
                                  <div className="text-left font-display">
                                    <p className="font-bold text-slate-105 text-sm">{client.name}</p>
                                    <p className="text-[10px] text-slate-500 select-all">{client.id.slice(0, 8).toUpperCase()}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4.5 px-6 font-mono text-[11px] leading-relaxed select-all text-slate-400">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-600" />
                                    <span>{client.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-600" />
                                    <span>+55 11 99999-0000</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4.5 px-6 md:text-center font-bold text-white text-sm">
                                {client.tripsCount}
                              </td>
                              <td className="py-4.5 px-6 font-mono text-[11px] text-slate-400">
                                {formatFriendlyDate(client.lastTripDate)}
                              </td>
                              <td className="py-4.5 px-6 text-right font-display font-black text-sm text-[#10b981]">
                                {formatCurrency(client.totalSpent)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================
                E) TAB: MOTORISTAS (CONTROLE DA FROTA)
               ============================================== */}
            {activeTab === 'motoristas' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left animate-fade-in">
                
                {/* Coluna Esquerda: Cartão do Motorista Ativo */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* Driver Visual Profile Card */}
                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none pr-6 pb-6">
                      <Car className="w-60 h-60" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between pb-6 border-b border-slate-900/60">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-roxou-purple/20 border border-roxou-purple flex items-center justify-center font-display font-black text-2xl text-roxou-neon">
                          FR
                        </div>
                        <div className="text-left font-display">
                          <span className="text-[10px] uppercase font-bold text-roxou-neon font-mono tracking-wider">MOTORISTA TITULAR</span>
                          <h3 className="font-extrabold text-lg text-white">Felipe Roxou</h3>
                          <p className="text-xs text-slate-400 mt-0.5">contato.fh3@gmail.com | Chave PIX</p>
                        </div>
                      </div>

                      <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-neon-green/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Shift Ativo</span>
                      </div>
                    </div>

                    {/* Especificações do Veículo Luxury */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6 text-xs text-slate-300">
                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                        <span className="text-slate-500 uppercase font-mono text-[9px] block">Veículo Ativo</span>
                        <p className="font-bold text-slate-150 mt-1 uppercase text-sm">Mercedes C-Class</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Premium Executivo Preto</p>
                      </div>

                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                        <span className="text-slate-500 uppercase font-mono text-[9px] block">Placa Regulamentada</span>
                        <p className="font-bold text-slate-150 mt-1 uppercase text-sm font-mono tracking-wide">ROX-0U26</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Sufixo Alfa de São Paulo</p>
                      </div>

                      <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                        <span className="text-slate-500 uppercase font-mono text-[9px] block">Histórico de saídas</span>
                        <p className="font-bold text-emerald-450 mt-1 uppercase text-sm">{concludedTrips.length} finalizadas</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Status 100% positivo</p>
                      </div>
                    </div>
                  </div>

                  {/* Regulamento Técnico de Procedimentos */}
                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 text-left">
                    <h4 className="font-display font-bold text-base text-slate-100 mb-3.5">Diretrizes do Serviço Premium</h4>
                    <p className="text-xs text-slate-400 leading-relaxed space-y-2">
                       Abaixo, as diretrizes reguladoras estipuladas pelo motorista executivo Roxou para garantir a melhor experiência: <br /><br />
                      &bull; <strong>Pontualidade:</strong> O motorista assume o compromisso de estar presente no endereço indicado com 10 minutos de antecedência. <br />
                      &bull; <strong>Comunicação direta:</strong> O chat interno deve ser mantido sincronizado para coordenar desvios ou alterações de trânsito. <br />
                      &bull; <strong>Forma de pagamento:</strong> As viagens agendadas requerem a liquidação via Pix direto na chave do motorista para consolidação na agenda.
                    </p>
                  </div>
                </div>

                {/* Coluna Direita: Painel de Visibilidade Uber em destaque */}
                <div className="xl:col-span-4">
                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 space-y-4">
                    <div className="flex gap-2 items-center text-roxou-neon">
                      <Car className="w-4.5 h-4.5" />
                      <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Serviço de Presença</h4>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-relaxed text-left">
                      Defina sua presença abaixo para os passageiros. Isso reflete nos widgets em tempo real nas landing pages e nas rotas de solicitação.
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      <button
                        onClick={() => handleChangeStatus('online')}
                        className={`p-3.5 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                          driverStatus?.status === 'online'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-neon-green/10'
                            : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-fast" />
                          <span>Disponível para Viagens</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleChangeStatus('ocupado')}
                        className={`p-3.5 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                          driverStatus?.status === 'ocupado'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                            : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Em Atendimento Corporativo</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleChangeStatus('offline')}
                        className={`p-3.5 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                          driverStatus?.status === 'offline'
                            ? 'bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                          <span>Offline / Fora de Expediente</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==============================================
                F) TAB: FINANCEIRO (CONTEÚDO GRÁFICO E LIST)
               ============================================== */}
            {activeTab === 'financeiro' && (
              <div className="space-y-6 text-left animate-fade-in">
                {/* 3 Cartões Maiores Financeiros */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6">
                    <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Receita Diária Estimada</span>
                    <p className="text-3xl font-display font-black text-white mt-1">
                      {formatCurrency(concludedTrips.filter(r => r.scheduled_date === now.toISOString().split('T')[0]).reduce((acc, r) => acc + (r.final_price || r.estimated_price), 0))}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-2.5">Faturamento nas últimas 24h</span>
                  </div>

                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6">
                    <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Receita Semanal Acumulada</span>
                    <p className="text-3xl font-display font-black text-white mt-1">
                      {formatCurrency(totalMonthlyEarnings * 0.28)} {/* Simulação proporcional */}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-2.5">&bull; +6.2% mais alto que semana passada</span>
                  </div>

                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6">
                    <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Faturamento Geral Sincronizado</span>
                    <p className="text-3xl font-display font-black text-roxou-neon mt-1">
                      {formatCurrency(totalConcludedEarnings)}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-2.5">{concludedTrips.length} corridas profissionais fechadas</span>
                  </div>
                </div>

                {/* Gráfico de Barras Financeiro em SVG */}
                <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6">
                  <h3 className="font-display font-bold text-base text-slate-100 mb-6">Gráfico de Histórico Semanal de Ganhos</h3>
                  
                  <div className="h-48 w-full flex items-end justify-between gap-4 pt-4 px-4 bg-slate-950/20 rounded-2xl border border-slate-900">
                    {[
                      { label: 'Sem 1', val: 300, pct: '30%' },
                      { label: 'Sem 2', val: 450, pct: '45%' },
                      { label: 'Sem 3', val: 780, pct: '78%' },
                      { label: 'Sem 4', val: 920, pct: '92%' },
                      { label: 'Corrente', val: 1250, pct: '100%', glow: true }
                    ].map((col, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          R$ {col.val}
                        </span>
                        <div
                          className={`w-10 sm:w-14 rounded-t-xl transition-all duration-305 ${
                            col.glow 
                              ? 'bg-gradient-to-t from-roxou-purple to-roxou-neon shadow-[0_0_15px_rgba(139,92,246,0.5)]' 
                              : 'bg-slate-800 group-hover:bg-slate-700'
                          }`}
                          style={{ height: col.pct }}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 mt-2">{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================
                G) TAB: CONFIGURAÇÕES (PRICING & RESET DB)
               ============================================== */}
            {/* ==============================================
                G1) TAB: PRECIFICAÇÃO (AVANÇADA MOTORISTAS)
               ============================================== */}
            {activeTab === 'precificacao' && (
              <div className="space-y-6 text-left animate-fade-in font-sans">
                {/* Cabeçalho de Precificação */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#070817]/60 border border-[#1d1f39]/40 rounded-3xl p-6 gap-4">
                  <div>
                    <h2 className="text-xl font-display font-black text-white tracking-tight flex items-center gap-2.5">
                      <TrendingUp className="w-5 h-5 text-roxou-neon" />
                      Precificação Premium Individualizada
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Configure o ecossistema financeiro e as regras tarifárias específicas por motorista particular da frota</p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-900 text-[10px] font-mono text-[#a78bfa] font-bold">
                    MODO DE CÁLCULO: MATEMÁTICA OPERACIONAL DE FLUXO
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Coluna Esquerda: Lista de Motoristas Cadastrados (4 Cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider mb-2 px-1">Selecione o Motorista para Ajuste</div>
                    
                    {adminDrivers.length === 0 ? (
                      <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 text-center text-slate-500 text-xs">
                        Nenhum motorista ativo registrado.
                      </div>
                    ) : (
                      adminDrivers.map((driver) => {
                        const isSelected = selectedDriverId === driver.id;
                        return (
                          <div
                            key={driver.id}
                            onClick={() => setSelectedDriverId(driver.id)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? 'bg-[#15122b]/60 border-[#5e389e] shadow-[0_8px_30px_rgba(139,92,246,0.1)]'
                                : 'bg-[#0a0b16] border-slate-900 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Foto de Perfil */}
                              <div className="relative">
                                <img
                                  src={driver.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
                                  alt={driver.display_name}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-full object-cover border border-[#302157]"
                                />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#090a14] ${
                                  driver.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                }`} />
                              </div>

                              {/* Informações Básicas */}
                              <div className="flex-grow min-w-0">
                                <h3 className="font-display font-medium text-xs text-white truncate">{driver.display_name}</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{driver.vehicle_model}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="font-mono text-[9px] bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-slate-300">
                                    {driver.vehicle_plate}
                                  </span>
                                  <span className={`text-[8px] font-mono font-bold uppercase ${
                                    driver.status === 'online' ? 'text-emerald-400' : 'text-slate-500'
                                  }`}>
                                    {driver.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Coluna Direita: Dashboard de Parâmetros de Precificação (8 Cols) */}
                  <div className="lg:col-span-8">
                    {pricingSettings ? (
                      <form onSubmit={handleSaveDriverPricing} className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 space-y-6">
                        
                        {/* Título de Seção Selecionada */}
                        <div className="flex justify-between items-center pb-4 border-b border-rose-950/20">
                          <div>
                            <span className="text-roxou-neon text-[9px] font-mono font-bold uppercase tracking-widest block font-sans">CHAUFFEUR FINANCE CONTROL</span>
                            <h3 className="font-display font-black text-base text-slate-100 mt-0.5">
                              {adminDrivers.find(d => d.id === selectedDriverId)?.display_name || 'Motorista'}
                            </h3>
                          </div>
                          <Car className="w-5 h-5 text-roxou-neon" />
                        </div>

                        {pricingMessage && (
                          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs ${
                            pricingMessage.type === 'success' 
                              ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400' 
                              : 'bg-rose-500/10 border border-rose-500/35 text-rose-400'
                          }`}>
                            {pricingMessage.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            )}
                            <p>{pricingMessage.text}</p>
                          </div>
                        )}

                        {/* Bento Grid dos Parâmetros (Formulário) */}
                        <div className="space-y-6 text-xs text-left">
                          {/* 1) GASTOS FIXOS E VARIÁVEIS (CUSTO DIRETOS) */}
                          <div>
                            <h4 className="text-[10px] uppercase font-bold text-[#b5a1fa] font-mono tracking-widest mb-3.5 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-roxou-neon" />
                              1. Custos Diretos do Veículo & Metas
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Valor do Combustível (R$/L)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pricingSettings.fuel_price}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, fuel_price: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Preço médio por litro de combustível</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Consumo Médio (Km/L)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={pricingSettings.vehicle_consumption_km_l}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, vehicle_consumption_km_l: Math.max(0.1, parseFloat(e.target.value) || 1) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Eficiência média de rodagem do veículo</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Custos Fixos / Aluguel Mensal (R$)</label>
                                <input
                                  type="number"
                                  step="1.00"
                                  value={pricingSettings.monthly_rent}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, monthly_rent: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Valor da parcela, seguro ou aluguel mensal</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Meta de Rodagem Mensal (Km)</label>
                                <input
                                  type="number"
                                  step="100"
                                  value={pricingSettings.monthly_km_goal}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, monthly_km_goal: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Quilometragem planejada para ratear custo</span>
                              </div>
                            </div>
                          </div>

                          {/* 2) MARGENS E PREÇO BASE (KM MÍNIMO E OPERACIONAL) */}
                          <div className="pt-4 border-t border-slate-900/60">
                            <h4 className="text-[10px] uppercase font-bold text-[#b5a1fa] font-mono tracking-widest mb-3.5 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-roxou-neon" />
                              2. Margem de Lucro & Parâmetros Base
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Preço Mínimo por Km (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pricingSettings.minimum_km_price}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, minimum_km_price: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Piso estipulado por Km</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Margem Operacional (%)</label>
                                <input
                                  type="number"
                                  step="1"
                                  value={pricingSettings.operational_margin_percent}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, operational_margin_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Sobretaxa adicionada ao custo</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Taxa Mínima Viagem (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pricingSettings.minimum_trip_price}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, minimum_trip_price: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Franquia mínima de saída</span>
                              </div>
                            </div>
                          </div>

                          {/* 3) ADICIONAIS ADICIONAIS E CONFORTOS (HORÁRIOS, TAXAS) */}
                          <div className="pt-4 border-t border-slate-900/60">
                            <h4 className="text-[10px] uppercase font-bold text-[#b5a1fa] font-mono tracking-widest mb-3.5 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-roxou-neon" />
                              3. Adicionais de Agenda & Serventia
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                              <div className="space-y-1.5 sm:col-span-1">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Deslocamento (%)</label>
                                <input
                                  type="number"
                                  step="1"
                                  value={pricingSettings.displacement_percent}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, displacement_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Mobilização inicial</span>
                              </div>

                              <div className="space-y-1.5 sm:col-span-1">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Adic. Noturno (%)</label>
                                <input
                                  type="number"
                                  step="1"
                                  value={pricingSettings.night_extra_percent}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, night_extra_percent: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Gravame de horário</span>
                              </div>

                              <div className="space-y-1.5 sm:col-span-1">
                                <label className="block text-[10px] text-slate-400 uppercase font-mono">Início Noturno</label>
                                <input
                                  type="text"
                                  placeholder="23:00"
                                  value={pricingSettings.night_extra_start_time}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, night_extra_start_time: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Limite noturno (HH:MM)</span>
                              </div>

                              <div className="space-y-1.5 sm:col-span-1">
                                <label className="block text-[10px] text-[#a78bfa] uppercase font-mono">Parada Adicional (R$)</label>
                                <input
                                  type="number"
                                  step="1.00"
                                  value={pricingSettings.stop_fee}
                                  onChange={(e) => setPricingSettings({ ...pricingSettings, stop_fee: Math.max(0, parseFloat(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-[#8b5cf6]/65 text-slate-100 rounded-xl py-2.5 px-3.5 font-bold focus:outline-none"
                                />
                                <span className="text-[9px] text-slate-550 block">Taxa fixa por parada</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Motor de Integração Visual Simulador Financeiro */}
                        <div className="p-5 rounded-2xl bg-[#03040c] border border-[#232049]/40 space-y-4 font-sans text-left">
                          <h4 className="text-[10px] text-indigo-400 uppercase font-bold font-mono tracking-wider text-left">Métrica de Custos e Tarifa Linear Estimada</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
                            <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-900">
                              <span className="text-[9px] text-slate-500 block uppercase">Custo Real Km Bruto</span>
                              <p className="text-sm font-black text-slate-350 mt-1">
                                {formatCurrency(liveCostAndPrice.raw)}
                              </p>
                            </div>
                            <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-900">
                              <span className="text-[9px] text-slate-500 block uppercase">Km Sugerido c/ Margem</span>
                              <p className="text-sm font-black text-slate-350 mt-1">
                                {formatCurrency(liveCostAndPrice.suggested)}
                              </p>
                            </div>
                            <div className="bg-[#100c25] p-3 rounded-xl border border-[#231e3d] shadow-[0_0_15px_rgba(139,92,246,0.06)]">
                              <span className="text-[9px] text-roxou-neon block uppercase font-bold">Tarifa Km Aplicada</span>
                              <p className="text-base font-black text-white mt-1">
                                {formatCurrency(liveCostAndPrice.final)} <span className="text-[9px] text-slate-400">/ km</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-[#0f1020]/40 p-2.5 rounded-xl border border-slate-900 text-left">
                            <Info className="w-3.5 h-3.5 text-roxou-neon flex-shrink-0" />
                            <p>
                              O motorista fará cobrança de no mínimo <strong className="text-white">{formatCurrency(pricingSettings.minimum_trip_price)}</strong> por viagem e <strong className="text-white">{formatCurrency(liveCostAndPrice.final)}</strong> por Km percorrido.
                            </p>
                          </div>
                        </div>

                        {/* Botão de Submissão Executivo */}
                        <div className="flex justify-end pt-3">
                          <button
                            type="submit"
                            disabled={isPricingSaving}
                            className="bg-gradient-to-r from-roxou-purple to-roxou-neon hover:from-[#6d28d9] hover:to-[#7c3aed] text-white px-7 py-3 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-neon-purple/20 cursor-pointer flex items-center gap-2"
                          >
                            {isPricingSaving ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>SALVANDO CONFIGURAÇÃO...</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>SALVAR CONFIGURAÇÃO FINANCEIRA</span>
                              </>
                            )}
                          </button>
                        </div>

                      </form>
                    ) : (
                      <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-12 text-center text-slate-400">
                        Selecione um motorista da frota para visualizar e configurar os parâmetros específicos de precificação.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'configuracoes' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left animate-fade-in font-sans">
                
                {/* Coluna Esquerda: Edição de preços determinística */}
                <div className="xl:col-span-8">
                  <form onSubmit={handleSavePrices} className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-900/60">
                      <div>
                        <h3 className="font-display font-black text-base text-slate-100">Configuração Tarifária</h3>
                        <p className="text-xs text-slate-450 mt-1">Defina os parâmetros globais que calculam orçamentos aos passageiros</p>
                      </div>
                      <Database className="w-5 h-5 text-roxou-neon" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left text-xs">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-wide font-bold text-slate-400">Tarifa Km (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={priceKm}
                          onChange={(e) => setPriceKm(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-roxou-purple text-slate-100 rounded-2xl py-3 px-4 font-bold text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 block mt-0.5">Valor multiplicado pela distância linear</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-wide font-bold text-slate-400">Taxa de Reserva de Agenda (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bookFee}
                          onChange={(e) => setBookFee(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-roxou-purple text-slate-100 rounded-2xl py-3 px-4 font-bold text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 block mt-0.5">Taxa de mobilização estipulada fixa</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-wide font-bold text-slate-400">Valor Mínimo Aceitável (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-roxou-purple text-slate-100 rounded-2xl py-3 px-4 font-bold text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 block mt-0.5">Nenhuma corrida será cotada abaixo desse preço</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] uppercase tracking-wide font-bold text-slate-400">Limite Máximo Passageiros</label>
                        <input
                          type="number"
                          value={maxPassengers}
                          onChange={(e) => setMaxPassengers(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-roxou-purple text-slate-100 rounded-2xl py-3 px-4 font-bold text-xs focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 block mt-0.5">Capacidade do carro executivo titular</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      {saveSuccess ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-450 font-bold animate-fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Preços Atualizados com Sucesso!</span>
                        </div>
                      ) : <div />}

                      <button
                        type="submit"
                        className="bg-roxou-purple hover:bg-roxou-neon text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-colors cursor-pointer"
                      >
                        Salvar Tarifário
                      </button>
                    </div>
                  </form>
                </div>

                {/* Coluna Direita: Status da Conexão / Ferramentas Admin */}
                <div className="xl:col-span-4 space-y-6">
                  {/* Status Backend Info Block */}
                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 text-left space-y-4">
                    <h4 className="font-display font-bold text-sm text-slate-100">Status dos Servidores</h4>
                    
                    <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3 font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">DATABASE INTEGRADO:</span>
                        <span className={`font-bold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isDemoMode ? 'SANDBOX LOCAL (LS)' : 'SUPABASE PRODUCTION'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">REALTIME SYNC CHANNEL:</span>
                        <span className="text-slate-350">ACTIVE SYNCING</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">SSL SECURITY CRYPTO:</span>
                        <span className="text-emerald-400">256-BIT PRIVATE KEY</span>
                      </div>
                    </div>
                    
                    {isDemoMode && (
                      <div className="pt-2 border-t border-slate-900/60">
                        <button
                          onClick={handleResetDemoDb}
                          disabled={resettingDemo}
                          className="w-full bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-950 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 ${resettingDemo ? 'animate-spin' : ''}`} />
                          <span>{resettingDemo ? 'Resetando...' : 'Resetar Banco de Dados Demo'}</span>
                        </button>
                        <p className="text-[9px] text-[#ef4444]/60 text-center mt-2 leading-relaxed">
                          ATENÇÃO: Isso apagará o localStorage e recarregará a página com dados limpos de teste originais.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0f1020] border border-slate-900 rounded-3xl p-6 text-left space-y-3">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <HelpCircle className="w-4.5 h-4.5" />
                      <h4 className="font-display font-semibold text-xs text-slate-300">Suporte ao Titular</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                       Este painel foi meticulosamente desenhado para fins de demonstração comercial da plataforma <strong>Reserva Roxou</strong>. <br />
                      Problemas técnicos? Entre em contato com o suporte direto comercial.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboardView;
