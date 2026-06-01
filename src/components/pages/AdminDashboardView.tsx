/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { isDemoMode, supabaseService, supabase } from '../../lib/supabase';
import { Profile, DriverStatus, DriverStatusType, RideRequest, RideStatus, PRICING_CONFIG, Driver, DriverSettings } from '../../types';
import { formatCurrency } from '../../lib/pricing';
import { useLocation, navigate } from '../../lib/navigation';
import { motion } from 'motion/react';
import {
  Shield,
  Clock,
  Car,
  TrendingUp,
  Calendar,
  Settings,
  Users,
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Menu,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  HelpCircle,
  Info,
  MapPin,
  ArrowRight,
  Activity,
  User,
  LogOut,
  ChevronRight,
  Check
} from 'lucide-react';
import { getRideStatusConfig } from '../RideCard';

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
  
  // Configurações Globais
  const [priceKm, setPriceKm] = useState(String(PRICING_CONFIG.pricePerKm));
  const [bookFee, setBookFee] = useState(String(PRICING_CONFIG.bookingFee));
  const [minPrice, setMinPrice] = useState(String(PRICING_CONFIG.minimumPrice));
  const [maxPassengers, setMaxPassengers] = useState(String(PRICING_CONFIG.maxPassengers));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  // Controle de Drivers para Precificação & Veículo
  const [adminDrivers, setAdminDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [pricingSettings, setPricingSettings] = useState<DriverSettings | null>(null);
  const [isPricingSaving, setIsPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form de Edição de Veículo
  const [vehicleModelInput, setVehicleModelInput] = useState('');
  const [vehiclePlateInput, setVehiclePlateInput] = useState('');
  const [vehiclePhotoUrlInput, setVehiclePhotoUrlInput] = useState('');
  const [driverStatusInput, setDriverStatusInput] = useState<DriverStatusType>('offline');
  const [vehicleConsumptionInput, setVehicleConsumptionInput] = useState('');
  const [isVehicleSaving, setIsVehicleSaving] = useState(false);
  const [vehicleMessage, setVehicleMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Relógio em tempo real
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Informações do Veículo Ativo
  const activeDriver = useMemo(() => {
    if (adminDrivers.length > 0) {
      return adminDrivers.find(d => d.id === selectedDriverId) || adminDrivers[0];
    }
    return null;
  }, [adminDrivers, selectedDriverId]);

  // Sincronizar inputs do veículo quando mudar de motorista
  useEffect(() => {
    if (activeDriver) {
      setVehicleModelInput(activeDriver.vehicle_model || '');
      setVehiclePlateInput(activeDriver.vehicle_plate || '');
      setVehiclePhotoUrlInput(activeDriver.vehicle_photo_url || '');
      setDriverStatusInput(activeDriver.status || 'offline');
    } else {
      setVehicleModelInput('');
      setVehiclePlateInput('');
      setVehiclePhotoUrlInput('');
      setDriverStatusInput('offline');
    }
  }, [activeDriver]);

  useEffect(() => {
    if (pricingSettings) {
      setVehicleConsumptionInput(pricingSettings.vehicle_consumption_km_l ? String(pricingSettings.vehicle_consumption_km_l) : '');
    } else {
      setVehicleConsumptionInput('');
    }
  }, [pricingSettings]);

  const handleSaveVehicleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    setIsVehicleSaving(true);
    setVehicleMessage(null);
    try {
      // 1. Atualizar drivers
      const driverSuccess = await supabaseService.updateDriver(selectedDriverId, {
        vehicle_model: vehicleModelInput,
        vehicle_plate: vehiclePlateInput,
        vehicle_photo_url: vehiclePhotoUrlInput,
        status: driverStatusInput
      });

      // 2. Atualizar driver_settings (consumo)
      const settingsSuccess = await supabaseService.updateDriverSettings(selectedDriverId, {
        vehicle_consumption_km_l: parseFloat(vehicleConsumptionInput) || 10.0
      });

      if (driverSuccess && settingsSuccess) {
        setVehicleMessage({ type: 'success', text: 'Veículo e consumo atualizados com sucesso!' });
        setTimeout(() => setVehicleMessage(null), 4000);
        
        // Recarregar os dados do driver na lista
        const list = await supabaseService.getDrivers();
        setAdminDrivers(list);
        
        // Recarregar as configurações de preço do driver selecionado
        const settings = await supabaseService.getDriverSettings(selectedDriverId);
        if (settings) {
          setPricingSettings(settings);
        }
      } else {
        setVehicleMessage({ type: 'error', text: 'Erro ao salvar algumas informações. Verifique os campos.' });
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do veículo:', err);
      setVehicleMessage({ type: 'error', text: 'Ocorreu um erro ao salvar as configurações do veículo.' });
    } finally {
      setIsVehicleSaving(false);
    }
  };

  // Mapear rota atual para a aba/seção ativa
  const activeTab = useMemo(() => {
    if (currentPath === '/admin/solicitacoes' || currentPath === '/admin/reservas') return 'solicitacoes';
    if (currentPath === '/admin/precificacao' || currentPath === '/admin/pricing') return 'precificacao';
    if (currentPath === '/admin/motoristas' || currentPath === '/admin/veiculo') return 'veiculo';
    if (currentPath === '/admin/configuracoes') return 'configuracoes';
    return 'dashboard'; // padrão /admin
  }, [currentPath]);

  // Carregar lista de motoristas e selecionar o primeiro
  useEffect(() => {
    async function loadDriversList() {
      try {
        const list = await supabaseService.getDrivers();
        setAdminDrivers(list);
        if (list.length > 0 && !selectedDriverId) {
          setSelectedDriverId(list[0].id);
        }
      } catch (e) {
        console.error('Erro ao buscar motoristas:', e);
      }
    }
    loadDriversList();
  }, [rides]);

  // Carregar os parâmetros do motorista selecionado
  useEffect(() => {
    if (!selectedDriverId) return;
    async function loadDriverPricingAndStatus() {
      try {
        const status = await supabaseService.getDriverStatus(selectedDriverId);
        setDriverStatus(status);

        const settings = await supabaseService.getDriverSettings(selectedDriverId);
        if (settings) {
          setPricingSettings(settings);
        } else {
          setPricingSettings({
            id: '',
            driver_id: selectedDriverId,
            fuel_price: 5.80,
            vehicle_consumption_km_l: 10.5,
            monthly_rent: 2800,
            monthly_km_goal: 4500,
            minimum_km_price: 2.50,
            operational_margin_percent: 50,
            displacement_percent: 15,
            night_extra_percent: 25,
            night_extra_start_time: '22:00',
            minimum_trip_price: 35.00,
            stop_fee: 15.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Erro ao buscar parâmetros e status:', err);
      }
    }
    loadDriverPricingAndStatus();
    setPricingMessage(null);
  }, [selectedDriverId]);

  // Carregar dados de solicitações reais e presença do motorista
  async function loadData() {
    try {
      if (selectedDriverId) {
        const status = await supabaseService.getDriverStatus(selectedDriverId);
        setDriverStatus(status);
      } else {
        const list = await supabaseService.getDrivers();
        if (list.length > 0) {
          const firstDriverId = list[0].id;
          const status = await supabaseService.getDriverStatus(firstDriverId);
          setDriverStatus(status);
        }
      }

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

    // Sincronização reativa em tempo real com o banco de dados
    const unsubscribeRides = supabaseService.subscribeToAllRides(() => {
      loadData();
    });

    return () => {
      unsubscribeRides();
    };
  }, [currentUser.id, selectedDriverId]);

  // Sugestão de valor por KM calculada dinamicamente com base em custos reais
  const suggestedValuePerKm = useMemo(() => {
    if (!pricingSettings) return 0;
    const fuel = Number(pricingSettings.fuel_price) || 0;
    const consumption = Number(pricingSettings.vehicle_consumption_km_l) || 1;
    const rent = Number(pricingSettings.monthly_rent) || 0;
    const goal = Number(pricingSettings.monthly_km_goal) || 1;
    const margin = Number(pricingSettings.operational_margin_percent) || 0;

    const fuelCostKm = fuel / consumption;
    const rentCostKm = rent / goal;
    const costPerKm = fuelCostKm + rentCostKm;
    
    // Cost Per KM + Driver Operational Margin
    const calculatedSuggested = costPerKm * (1 + margin / 100);
    return Math.max(calculatedSuggested, pricingSettings.minimum_km_price || 0.1);
  }, [pricingSettings]);

  // Alterar disponibilidade de status do motorista em tempo real
  const handleChangeStatus = async (newStatus: DriverStatusType) => {
    setUpdatingStatus(true);
    try {
      const success = await supabaseService.updateDriverStatus(currentUser.id, newStatus);
      if (success) {
        setDriverStatus(prev => prev ? { ...prev, status: newStatus, updated_at: new Date().toISOString() } : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Salvar parâmetros individuais de precificação do motorista
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
        setPricingMessage({ type: 'error', text: 'Erro ao salvar configurações de precificação.' });
      }
    } catch (err) {
      console.error(err);
      setPricingMessage({ type: 'error', text: 'Ocorreu um erro ao salvar parâmetros no banco.' });
    } finally {
      setIsPricingSaving(false);
    }
  };

  // Salvar configurações gerais
  const handleSaveGlobalPrices = (e: React.FormEvent) => {
    e.preventDefault();
    PRICING_CONFIG.pricePerKm = Number(priceKm) || 2.50;
    PRICING_CONFIG.bookingFee = Number(bookFee) || 20.00;
    PRICING_CONFIG.minimumPrice = Number(minPrice) || 30.00;
    PRICING_CONFIG.maxPassengers = Number(maxPassengers) || 4;
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Logout utilizando supabase.auth.signOut() para ambos os fluxos
  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      if (supabase) {
        await supabase.auth.signOut();
      }
      console.error('[AUTH REDIRECT]', 'Usuário clicou em Sair da Conta a partir do Painel de Admin.');
      navigate('/login');
      window.location.reload();
    } catch (err) {
      console.error('Falha ao deslogar:', err);
    }
  };

  const handleResetDemoDb = () => {
    if (!isDemoMode) return;
    if (confirm('Deseja realmente redefinir a base DEMO com dados padrão limpos?')) {
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

  // --- COMPUTAÇÃO DE KPIS OPERACIONAIS REAIS (BANCO DE DADOS) ---
  const pendentesCount = useMemo(() => {
    return rides.filter(r => r.status === 'pendente').length;
  }, [rides]);

  const confirmadasCount = useMemo(() => {
    return rides.filter(r => r.status === 'confirmado_reserva' || r.status === 'confirmado_pagamento' || r.status === 'em_viagem').length;
  }, [rides]);

  const finalizadasCount = useMemo(() => {
    return rides.filter(r => r.status === 'concluido').length;
  }, [rides]);

  const faturamentoPrevisto = useMemo(() => {
    const validRides = rides.filter(r => r.status !== 'cancelado' && r.status !== 'recusado');
    return validRides.reduce((sum, r) => sum + (r.final_price || r.estimated_price || 0), 0);
  }, [rides]);

  // Lista de solicitações filtradas
  const filteredRidesList = useMemo(() => {
    return rides.filter(r => {
      const q = searchQuery.toLowerCase();
      return (
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.profiles?.full_name || 'Passageiro').toLowerCase().includes(q)
      );
    });
  }, [rides, searchQuery]);

  // --- KANBAN OPERACIONAL REAL COM 6 COLUNAS ---
  const columnDefs: { id: string; label: string; bgStyle: string; statusFilter: (r: RideRequest) => boolean }[] = [
    {
      id: 'pendente',
      label: 'Pendente',
      bgStyle: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
      statusFilter: (r) => r.status === 'pendente'
    },
    {
      id: 'respondida',
      label: 'Respondida',
      bgStyle: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
      statusFilter: (r) => r.status === 'aprovado'
    },
    {
      id: 'confirmada',
      label: 'Confirmada',
      bgStyle: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
      statusFilter: (r) => r.status === 'confirmado_reserva' || r.status === 'confirmado_pagamento'
    },
    {
      id: 'em_andamento',
      label: 'Em Andamento',
      bgStyle: 'bg-purple-500/10 border-purple-500/25 text-purple-400',
      statusFilter: (r) => r.status === 'em_viagem'
    },
    {
      id: 'finalizada',
      label: 'Finalizada',
      bgStyle: 'bg-slate-500/10 border-slate-500/25 text-slate-400',
      statusFilter: (r) => r.status === 'concluido'
    },
    {
      id: 'cancelada',
      label: 'Cancelada',
      bgStyle: 'bg-rose-500/10 border-rose-500/25 text-rose-400',
      statusFilter: (r) => r.status === 'cancelado' || r.status === 'recusado'
    }
  ];

  // Drag and drop do Kanban
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverCol(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const updateRideStatusDirectly = async (rideId: string, colId: string) => {
    let targetStatus: RideStatus = 'pendente';
    if (colId === 'pendente') targetStatus = 'pendente';
    else if (colId === 'respondida') targetStatus = 'aprovado';
    else if (colId === 'confirmada') targetStatus = 'confirmado_reserva';
    else if (colId === 'em_andamento') targetStatus = 'em_viagem';
    else if (colId === 'finalizada') targetStatus = 'concluido';
    else if (colId === 'cancelada') targetStatus = 'cancelado';

    try {
      const rideToUpdate = rides.find(r => r.id === rideId);
      if (!rideToUpdate) return;

      const payload: any = { status: targetStatus };
      if (targetStatus === 'aprovado' && !rideToUpdate.final_price) {
        payload.final_price = rideToUpdate.estimated_price;
      }

      const success = await supabaseService.updateRideRequest(rideId, payload);
      if (success) {
        setRides(prev => prev.map(r => r.id === rideId ? { ...r, ...payload, updated_at: new Date().toISOString() } : r));
      }
    } catch (err) {
      console.error('Erro de status no Kanban:', err);
    }
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const rideId = e.dataTransfer.getData('text/plain');
    if (!rideId) return;
    await updateRideStatusDirectly(rideId, colId);
  };

  // Sidebar Itens simplificados em sintonia perfeita com as abas e rotas
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'solicitacoes', label: 'Central de Reservas', icon: ClipboardList, path: '/admin/solicitacoes', badge: pendentesCount },
    { id: 'precificacao', label: 'Precificação', icon: TrendingUp, path: '/admin/precificacao' },
    { id: 'veiculo', label: 'Veículo', icon: Car, path: '/admin/veiculo' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/admin/configuracoes' }
  ];

  return (
    <div className="flex-grow w-full flex bg-[#030305] text-slate-150 min-h-[92vh] relative select-none overflow-hidden font-sans">
      
      {/* Glow Roxo Premium de Fundo */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-950/10 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* 1) BARRA LATERAL (SIDEBAR) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#090a12]/92 backdrop-blur-3xl border-r border-slate-900 flex flex-col justify-between transition-all duration-300 transform 
        lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:sticky lg:top-[53px]'}`}
        style={{ height: 'calc(100vh - 53px)' }}
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <span className="font-display font-black text-xl text-white">R</span>
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-sm text-white tracking-widest uppercase">ROXOU</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider font-mono">Privado</p>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-900 w-full" />

          {/* Navegação */}
          <nav className="flex flex-col gap-1">
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-purple-950/20 text-purple-300 border border-purple-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-900 text-left text-[10px] text-slate-500 font-mono">
          <p className="font-bold text-slate-400">Reserva Roxou</p>
          <p className="text-[9px] text-slate-600 mt-1">SaaS de Mobilidade Executive v2.0</p>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 z-35 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* 2) ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-grow flex flex-col min-w-0 bg-transparent p-4 sm:p-6 lg:p-8 relative z-10 overflow-y-auto">
        
        {/* TOP BAR INTERFACE */}
        <div className="w-full bg-[#0a0b12]/85 backdrop-blur-2xl border border-slate-900 rounded-3xl p-4.5 mb-8 flex flex-col xl:flex-row items-center justify-between gap-5 shadow-xl relative overflow-hidden">
          
          <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-300 lg:hidden cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>

              <div className="text-left">
                <span className="text-[9px] font-mono font-black text-purple-400 uppercase tracking-widest leading-none">PAINEL OPERACIONAL</span>
                <h1 className="font-display font-black text-sm text-white tracking-widest uppercase block mt-1">RESERVA ROXOU</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-emerald-400">SISTEMA ATIVO</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[9px] text-slate-400">
                <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                <span>SÃO PAULO, BRASIL</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 border-slate-900 pt-4 xl:pt-0">
            {/* Relógio Real-time */}
            <div className="flex items-center gap-2.5 bg-slate-950/80 px-4 py-2 border border-slate-900 rounded-xl font-mono text-[10px] text-slate-300">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{currentTime.toLocaleTimeString('pt-BR')}</span>
            </div>

            {/* Disponibilidade do Motorista Chauffeur */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-1 flex gap-1 items-center">
              <button
                onClick={() => handleChangeStatus('online')}
                disabled={updatingStatus}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  driverStatus?.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-450 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${driverStatus?.status === 'online' ? 'bg-[#10b981] animate-pulse' : 'bg-slate-700'}`} />
                <span>Disponível</span>
              </button>

              <button
                onClick={() => handleChangeStatus('ocupado')}
                disabled={updatingStatus}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  driverStatus?.status === 'ocupado'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-450 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${driverStatus?.status === 'ocupado' ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                <span>Em Serviço</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs font-mono">Carregando dados operacionais reais...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ========================================================
                1) ABA: DASHBOARD (KPIS REAIS E LISTAGEM REAL)
                ======================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* KPIs OPERACIONAIS REAIS (MANDATÓRIO) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1 */}
                  <div className="bg-[#0b0c14] border border-slate-900 rounded-2xl p-5 text-left relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Solicitações Pendentes</p>
                        <h3 className="font-display font-black text-2xl text-slate-100 mt-2">{pendentesCount}</h3>
                      </div>
                      <div className="p-2.5 bg-amber-500/10 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 right-0 h-[3px] bg-amber-500/20" />
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-[#0b0c14] border border-slate-900 rounded-2xl p-5 text-left relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Solicitações Confirmadas</p>
                        <h3 className="font-display font-black text-2xl text-slate-100 mt-2">{confirmadasCount}</h3>
                      </div>
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 right-0 h-[3px] bg-emerald-500/20" />
                  </div>

                  {/* KPI 3 */}
                  <div className="bg-[#0b0c14] border border-slate-900 rounded-2xl p-5 text-left relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Viagens Finalizadas</p>
                        <h3 className="font-display font-black text-2xl text-slate-100 mt-2">{finalizadasCount}</h3>
                      </div>
                      <div className="p-2.5 bg-purple-500/10 rounded-xl">
                        <Car className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 right-0 h-[3px] bg-purple-500/20" />
                  </div>

                  {/* KPI 4 */}
                  <div className="bg-[#0b0c14] border border-slate-900 rounded-2xl p-5 text-left relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Faturamento Previsto</p>
                        <h3 className="font-display font-black text-2xl text-slate-100 mt-2">
                          {formatCurrency(faturamentoPrevisto)}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="absolute left-0 bottom-0 right-0 h-[3px] bg-cyan-500/20" />
                  </div>
                </div>

                {/* BUSCA E ÚLTIMAS SOLICITAÇÕES REAIS */}
                <div className="bg-[#0b0c14] border border-slate-900 rounded-3xl p-6 text-left space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-100">Fila de Reservas Operacionais</h3>
                      <p className="text-xs text-slate-500 mt-1">Acompanhe todas as cotações e solicitações vindas dos passageiros</p>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Origem, destino ou cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  {filteredRidesList.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                      Nenhuma solicitação encontrada no banco de dados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-widest text-[9px] font-mono">
                            <th className="py-4.5 px-4 font-bold">Reserva ID</th>
                            <th className="py-4.5 px-4 font-bold">Passageiro</th>
                            <th className="py-4.5 px-4 font-bold">Trajeto (De / Para)</th>
                            <th className="py-4.5 px-4 font-bold">Horário</th>
                            <th className="py-4.5 px-4 font-bold">Valor</th>
                            <th className="py-4.5 px-4 font-bold">Status</th>
                            <th className="py-4.5 px-4 font-bold text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRidesList.slice(0, 8).map(ride => {
                            const statusCfg = getRideStatusConfig(ride.status);
                            return (
                              <tr key={ride.id} className="border-b border-slate-900 hover:bg-[#1a1b25]/20 transition-colors">
                                <td className="py-4 px-4 font-mono font-bold text-slate-400">
                                  #{ride.id.substring(0, 8).toUpperCase()}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-900/35 border border-purple-800/40 flex items-center justify-center text-[10px] font-bold text-purple-300">
                                      {ride.profiles?.full_name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-200">{ride.profiles?.full_name || 'Passageiro'}</p>
                                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ride.profiles?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 max-w-xs">
                                  <div className="space-y-1">
                                    <p className="text-slate-200 truncate font-semibold"><span className="text-emerald-400 text-[10px] mr-1">●</span>{ride.origin}</p>
                                    <p className="text-slate-400 truncate"><span className="text-purple-400 text-[10px] mr-1">▲</span>{ride.destination}</p>
                                  </div>
                                </td>
                                <td className="py-4 px-4 font-mono text-slate-350">
                                  {ride.scheduled_date.split('-').reverse().join('/')} às {ride.scheduled_time}
                                </td>
                                <td className="py-4 px-4 font-bold font-mono text-slate-100">
                                  {formatCurrency(ride.final_price || ride.estimated_price)}
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${statusCfg.bgClass} ${statusCfg.textClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                                    {statusCfg.label}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <button
                                    onClick={() => navigate(`/reserva/${ride.id}`)}
                                    className="bg-purple-900/40 hover:bg-purple-900/75 text-purple-300 px-3 py-1.5 rounded-lg font-bold border border-purple-500/20 transition-all cursor-pointer"
                                  >
                                    Gerenciar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                2) ABA: CENTRAL DE RESERVAS (KANBAN REAL)
                ======================================================== */}
            {activeTab === 'solicitacoes' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div>
                  <h3 className="font-display font-black text-lg text-slate-100">Central de Reservas Kanban</h3>
                  <p className="text-xs text-slate-500 mt-1">Arraste os cartões de corrida para as respectivas etapas para alterar seu status de forma dinâmica</p>
                </div>

                {/* Grid das Colunas Kanban */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start">
                  {columnDefs.map(col => {
                    const colRides = rides.filter(col.statusFilter);
                    return (
                      <div
                        key={col.id}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`bg-[#0a0b12] border rounded-2xl p-4 flex flex-col min-h-[500px] transition-all space-y-3.5 ${
                          draggedOverCol === col.id ? 'border-purple-500/70 bg-[#0f101f]' : 'border-slate-900'
                        }`}
                      >
                        {/* Header da Coluna */}
                        <div className="flex items-center justify-between font-mono">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${col.bgStyle}`}>
                            {col.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md">
                            {colRides.length}
                          </span>
                        </div>

                        {/* Lista de Cards da Coluna */}
                        <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] pr-1">
                          {colRides.length === 0 ? (
                            <div className="h-24 flex items-center justify-center border border-dashed border-slate-900 rounded-xl text-[10px] text-slate-600">
                              Sem itens
                            </div>
                          ) : (
                            colRides.map(ride => (
                              <div
                                key={ride.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, ride.id)}
                                className="bg-[#121320] hover:bg-[#18192c] border border-slate-850 hover:border-purple-500/35 rounded-xl p-3.5 space-y-3 cursor-grab active:cursor-grabbing transition-all text-left"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-mono font-bold text-purple-400 uppercase">
                                    #{ride.id.substring(0, 4).toUpperCase()}
                                  </span>
                                  <span className="text-slate-500 font-mono">
                                    {ride.scheduled_time}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] text-slate-300 font-medium truncate font-sans">
                                    {ride.profiles?.full_name || 'Passageiro'}
                                  </p>
                                  <p className="text-[10px] text-slate-450 truncate">
                                    <span className="text-emerald-450 mr-1 font-bold">De:</span>
                                    {ride.origin.split(',')[0]}
                                  </p>
                                  <p className="text-[10px] text-slate-450 truncate">
                                    <span className="text-purple-400 mr-1 font-bold">Para:</span>
                                    {ride.destination.split(',')[0]}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-900/60 font-mono">
                                  <span className="text-[9px] text-slate-500">
                                    {ride.scheduled_date.split('-').slice(1).reverse().join('/')}
                                  </span>
                                  <span className="text-[11px] font-bold text-purple-300">
                                    {formatCurrency(ride.final_price || ride.estimated_price)}
                                  </span>
                                </div>

                                {/* Touch fallback manual actions */}
                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900/50 justify-end">
                                  {col.id === 'pendente' && (
                                    <button
                                      onClick={() => updateRideStatusDirectly(ride.id, 'respondida')}
                                      className="text-[9px] bg-blue-950/40 border border-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-black cursor-pointer hover:bg-blue-900/50"
                                    >
                                      Aprovar
                                    </button>
                                  )}
                                  {col.id === 'respondida' && (
                                    <button
                                      onClick={() => updateRideStatusDirectly(ride.id, 'confirmada')}
                                      className="text-[9px] bg-emerald-950/40 border border-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-black cursor-pointer hover:bg-emerald-900/50"
                                    >
                                      Confirmar
                                    </button>
                                  )}
                                  {col.id === 'confirmada' && (
                                    <button
                                      onClick={() => updateRideStatusDirectly(ride.id, 'em_andamento')}
                                      className="text-[9px] bg-purple-950/40 border border-purple-900 text-purple-350 px-1.5 py-0.5 rounded font-black cursor-pointer hover:bg-purple-900/50"
                                    >
                                      Iniciar
                                    </button>
                                  )}
                                  {col.id === 'em_andamento' && (
                                    <button
                                      onClick={() => updateRideStatusDirectly(ride.id, 'finalizada')}
                                      className="text-[9px] bg-slate-900 border border-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-black cursor-pointer hover:bg-slate-800"
                                    >
                                      Concluir
                                    </button>
                                  )}
                                  {col.id !== 'finalizada' && col.id !== 'cancelada' && (
                                    <button
                                      onClick={() => updateRideStatusDirectly(ride.id, 'cancelada')}
                                      className="text-[9px] bg-rose-950/20 border border-rose-950 text-rose-400 px-1.5 py-0.5 rounded font-black cursor-pointer hover:bg-rose-950/50"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                  <button
                                    onClick={() => navigate(`/reserva/${ride.id}`)}
                                    className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                                  >
                                    Ver Detalhes
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                3) ABA: PRECIFICAÇÃO (REQUISITOS COMPLETOS)
                ======================================================== */}
            {activeTab === 'precificacao' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left animate-fade-in">
                
                {/* Lateral Esquerda: Seleção de Motorista */}
                <div className="xl:col-span-4 bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 space-y-4">
                  <div>
                    <h3 className="font-display font-black text-sm text-white">Chauffeurs Disponíveis</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Selecione para configurar custos de combustível e margens de operação individuais</p>
                  </div>

                  {adminDrivers.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 font-mono">Sem motoristas registrados.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {adminDrivers.map(dr => (
                        <button
                          key={dr.id}
                          onClick={() => setSelectedDriverId(dr.id)}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedDriverId === dr.id
                              ? 'bg-purple-950/20 border-purple-900/60 text-purple-300'
                              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden">
                              <User className="w-4 h-4 text-slate-450" />
                            </div>
                            <div>
                              <p className="text-xs font-bold font-sans">{dr.display_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{dr.vehicle_model}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form de Parâmetros de Precificação (MANDATÓRIO) */}
                <div className="xl:col-span-8 bg-[#0a0b12] border border-slate-900 rounded-3xl p-6">
                  {pricingSettings ? (
                    <form onSubmit={handleSaveDriverPricing} className="space-y-6">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                        <div>
                          <h3 className="font-display font-bold text-sm text-slate-100">Calculadora de Parâmetros do Chauffeur</h3>
                          <p className="text-[11px] text-slate-500 mt-1">Configure custos de rodagem para calcular a recomendação de valor mínimo por KM para o passageiro</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                        {/* 1. Combustível */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Combustível (R$/L)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={pricingSettings.fuel_price}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, fuel_price: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Preço médio atual do combustível (Gasolina/Etanol)</span>
                        </div>

                        {/* 2. Consumo */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Consumo Médio (Km/L)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pricingSettings.vehicle_consumption_km_l}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, vehicle_consumption_km_l: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Rendimento real do motor do veículo em trânsito urbano</span>
                        </div>

                        {/* 3. Aluguel */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Aluguel / Custo Mensal Veículo (R$)</label>
                          <input
                            type="number"
                            step="1"
                            value={pricingSettings.monthly_rent}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, monthly_rent: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Investimento mensal fixo (parcela, aluguel ou depreciação)</span>
                        </div>

                        {/* 4. Meta Mensal */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Meta de Rodagem Mensal (Km)</label>
                          <input
                            type="number"
                            step="1"
                            value={pricingSettings.monthly_km_goal}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, monthly_km_goal: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Kilometragem operacional alvo estipulada para o período de 30 dias</span>
                        </div>

                        {/* 5. KM Mínimo */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">KM Mínimo do Motorista (R$/Km)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={pricingSettings.minimum_km_price}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, minimum_km_price: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Piso mínimo aceitável de remuneração por Km rodado</span>
                        </div>

                        {/* 6. Margem Operacional */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Margem Operacional (%)</label>
                          <input
                            type="number"
                            step="1"
                            value={pricingSettings.operational_margin_percent}
                            onChange={(e) => setPricingSettings({ ...pricingSettings, operational_margin_percent: Number(e.target.value) })}
                            className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-500 block">Porcentagem de margem adicionada para lucro e impostos da reserva</span>
                        </div>
                      </div>

                      {/* AREA DE EXIBIÇÃO DE SUGESTÃO DE VALOR POR KM (MANDATÓRIO) */}
                      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 block flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-left space-y-1">
                          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">RESULTADO DEDUÇÃO DETERMINÍSTICA</p>
                          <h4 className="font-display font-black text-[#a78bfa] text-xs">Cálculo de Preço Mínimo de Sobrevivência</h4>
                          <p className="text-[10px] text-[#8b5cf6]/65 leading-normal max-w-sm">Dedução direta baseada em custo bruto de combustível (R${(pricingSettings.fuel_price / pricingSettings.vehicle_consumption_km_l).toFixed(2)}/Km) + diluição de aluguel fixo (R${(pricingSettings.monthly_rent / pricingSettings.monthly_km_goal).toFixed(2)}/Km).</p>
                        </div>
                        <div className="bg-purple-950/20 border border-purple-900/60 rounded-xl py-3.5 px-6 shrink-0 text-center md:text-right">
                          <p className="text-[9px] uppercase tracking-wider font-mono font-semibold text-purple-400">Sugestão de Valor por KM</p>
                          <h3 className="font-display font-black text-white text-2xl mt-1">
                            {formatCurrency(suggestedValuePerKm)} / Km
                          </h3>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        {pricingMessage ? (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${pricingMessage.type === 'success' ? 'text-emerald-450' : 'text-rose-400'}`}>
                            {pricingMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                            <span>{pricingMessage.text}</span>
                          </div>
                        ) : <div />}

                        <button
                          type="submit"
                          disabled={isPricingSaving}
                          className="bg-purple-600 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all cursor-pointer"
                        >
                          {isPricingSaving ? 'Salvando...' : 'Atualizar Parâmetros'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-500">
                      Nenhum motorista selecionado para configurar precificação.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                4) ABA: VEÍCULO (MANDATÓRIO REAIS REGISTROS)
                ======================================================== */}
            {activeTab === 'veiculo' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left animate-fade-in font-sans">
                
                {/* Lateral Esquerda: Seleção de Motorista */}
                <div className="xl:col-span-4 bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 space-y-4">
                  <div>
                    <h3 className="font-display font-black text-sm text-white">Chauffeurs Disponíveis</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Selecione para acompanhar e atualizar o cadastro do veículo titular correspondente</p>
                  </div>

                  {adminDrivers.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 font-mono">Sem motoristas cadastrados.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {adminDrivers.map(dr => (
                        <button
                          key={dr.id}
                          onClick={() => setSelectedDriverId(dr.id)}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedDriverId === dr.id
                              ? 'bg-purple-950/20 border-purple-900/60 text-purple-300'
                              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden">
                              {dr.photo_url ? (
                                <img src={dr.photo_url} alt={dr.display_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User className="w-4 h-4 text-slate-450" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold font-sans">{dr.display_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {dr.vehicle_model || 'Sem Veículo'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lateral Direita: Card e Formulário */}
                <div className="xl:col-span-8 space-y-6">
                  {activeDriver ? (
                    <>
                      {/* Visual Card */}
                      <div className="bg-[#0a0b12] border border-slate-900 rounded-3xl overflow-hidden shadow-lg">
                        <div className="h-64 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
                          {activeDriver.vehicle_photo_url ? (
                            <img
                              src={activeDriver.vehicle_photo_url}
                              alt={activeDriver.vehicle_model || 'Veículo do Motorista'}
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-650 p-8 space-y-2">
                              <Car className="w-12 h-12 text-slate-800 animate-pulse" />
                              <span className="text-xs font-semibold text-amber-500/85 uppercase tracking-wider font-mono">Foto do veículo não enviada</span>
                              <span className="text-[10px] text-slate-550">Insira uma URL válida abaixo para exibir a imagem real do veículo</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
                          <div className="absolute bottom-5 left-5 right-5 text-left pointer-events-none">
                            <div className="flex items-center gap-2">
                              {activeDriver.photo_url && (
                                <img src={activeDriver.photo_url} className="w-6 h-6 rounded-full border border-purple-500/30 object-cover" referrerPolicy="no-referrer" />
                              )}
                              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-md px-2.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-widest">
                                CHAUFFEUR: {activeDriver.display_name}
                              </span>
                            </div>
                            <h4 className="font-display font-black text-2xl text-white mt-2">
                              {activeDriver.vehicle_model || (
                                <span className="text-amber-500 italic">Veículo não configurado</span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-450 mt-1 font-mono">
                              Placa Oficial:{' '}
                              {activeDriver.vehicle_plate ? (
                                <span className="font-bold text-slate-200">{activeDriver.vehicle_plate}</span>
                              ) : (
                                <span className="text-amber-500 italic">Placa não cadastrada</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs border-t border-slate-900 bg-slate-950/40">
                          <div>
                            <p className="text-slate-500 uppercase text-[9px] tracking-wider">CONSUMO</p>
                            <p className="text-xs font-bold text-emerald-400 mt-1">
                              {pricingSettings?.vehicle_consumption_km_l ? `${pricingSettings.vehicle_consumption_km_l} Km / L` : <span className="text-amber-500/70 italic">Não cadastrado</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-[9px] tracking-wider">VALOR COMBUSTÍVEL</p>
                            <p className="text-xs font-bold text-purple-400 mt-1">
                              {pricingSettings?.fuel_price ? `R$ ${pricingSettings.fuel_price.toFixed(2)}` : <span className="text-slate-550">R$ 0.00</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold text-[#b8abff]">ALUGUEL MENSAL</p>
                            <p className="text-xs font-bold text-[#b8abff] mt-1">
                              {pricingSettings?.monthly_rent ? `R$ ${pricingSettings.monthly_rent.toLocaleString('pt-BR')}` : <span className="text-slate-500">---</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold text-slate-450">META MENSAL KM</p>
                            <p className="text-xs font-bold text-slate-300 mt-1">
                              {pricingSettings?.monthly_km_goal ? `${pricingSettings.monthly_km_goal.toLocaleString('pt-BR')} Km` : <span className="text-slate-500">---</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="px-6 py-3 bg-[#0c0d18] border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>STATUS EM TEMPO REAL:</span>
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                            activeDriver.status === 'online'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : activeDriver.status === 'ocupado'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            {activeDriver.status ? activeDriver.status.toUpperCase() : 'OFFLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Editing Form */}
                      <form onSubmit={handleSaveVehicleConfig} className="bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                          <div>
                            <h3 className="font-display font-black text-sm text-white">Editar Cadastro do Veículo e Status</h3>
                            <p className="text-xs text-slate-500 mt-1">Atualize os dados reais de frota do motorista selecionado</p>
                          </div>
                          <Settings className="w-5 h-5 text-purple-400" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Modelo do Veículo</label>
                            <input
                              type="text"
                              value={vehicleModelInput}
                              onChange={(e) => setVehicleModelInput(e.target.value)}
                              placeholder="Ex: Mercedes-Benz E-Class"
                              className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Placa do Veículo</label>
                            <input
                              type="text"
                              value={vehiclePlateInput}
                              onChange={(e) => setVehiclePlateInput(e.target.value)}
                              placeholder="Ex: ABC1D23"
                              className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none font-sans"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">URL da Foto do Veículo</label>
                            <input
                              type="url"
                              value={vehiclePhotoUrlInput}
                              onChange={(e) => setVehiclePhotoUrlInput(e.target.value)}
                              placeholder="https://exemplo.com/foto.jpg"
                              className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Status de Disponibilidade</label>
                            <select
                              value={driverStatusInput}
                              onChange={(e) => setDriverStatusInput(e.target.value as DriverStatusType)}
                              className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none font-sans"
                            >
                              <option value="online">Online</option>
                              <option value="ocupado">Ocupado</option>
                              <option value="offline">Offline</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Consumo de Combustível (Km/L)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={vehicleConsumptionInput}
                              onChange={(e) => setVehicleConsumptionInput(e.target.value)}
                              placeholder="Ex: 10.5"
                              className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-900 gap-4">
                          {vehicleMessage ? (
                            <div className={`flex items-center gap-2 text-xs font-bold leading-normal ${
                              vehicleMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {vehicleMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                              <span>{vehicleMessage.text}</span>
                            </div>
                          ) : <div />}

                          <button
                            type="submit"
                            disabled={isVehicleSaving}
                            className="bg-purple-600 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all cursor-pointer disabled:opacity-55"
                          >
                            {isVehicleSaving ? 'Salvando...' : 'Salvar Cadastro'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-500 bg-[#0a0b12] border border-slate-900 rounded-3xl">
                      Nenhum motorista disponível para configurar veículo.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================================
                5) ABA: CONFIGURAÇÕES (GLOBAL E BOTÃO SAIR DE CONTA)
                ======================================================== */}
            {activeTab === 'configuracoes' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left animate-fade-in font-sans">
                
                {/* Tarifário Global */}
                <div className="xl:col-span-8">
                  <form onSubmit={handleSaveGlobalPrices} className="bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-900">
                      <div>
                        <h3 className="font-display font-black text-sm text-white">Configuração Global Roxou</h3>
                        <p className="text-xs text-slate-500 mt-1">Configura os limites padrão globais para todos os orçamentos</p>
                      </div>
                      <Database className="w-5 h-5 text-purple-400" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Tarifa Km (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={priceKm}
                          onChange={(e) => setPriceKm(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Taxa de Reserva de Agenda (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bookFee}
                          onChange={(e) => setBookFee(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Valor Mínimo Aceitável (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-450">Limite Máximo Passageiros</label>
                        <input
                          type="number"
                          value={maxPassengers}
                          onChange={(e) => setMaxPassengers(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-900 focus:border-purple-700 text-slate-100 rounded-xl py-3 px-4 font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      {saveSuccess ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-450 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Preços Globais Atualizados com Sucesso!</span>
                        </div>
                      ) : <div />}

                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-400 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer"
                      >
                        Salvar Tarifário Global
                      </button>
                    </div>
                  </form>
                </div>

                {/* Sair da Conta & Ferramentas do Database */}
                <div className="xl:col-span-4 space-y-6">
                  
                  {/* Status do Banco de Dados */}
                  <div className="bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 text-left space-y-4">
                    <h4 className="font-display font-bold text-sm text-slate-150">Status de Conectividade</h4>
                    
                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl space-y-3 font-mono text-[10px] text-slate-450">
                      <div className="flex items-center justify-between">
                        <span>BANCO INTEGRADO:</span>
                        <span className={`font-bold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isDemoMode ? 'SANDBOX LOCAL (LS)' : 'SUPABASE PRODUCTION'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ESTADO DA SECÇÃO:</span>
                        <span className="text-emerald-400 font-bold uppercase">AUTENTICADO</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>SEU PERFIL DE ACESSO:</span>
                        <span className="text-purple-400 font-bold uppercase">DIRETOR ADMIN</span>
                      </div>
                    </div>
                    
                    {isDemoMode && (
                      <div className="pt-2 border-t border-slate-900">
                        <button
                          onClick={handleResetDemoDb}
                          disabled={resettingDemo}
                          className="w-full bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-950 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 ${resettingDemo ? 'animate-spin' : ''}`} />
                          <span>{resettingDemo ? 'Redefinindo...' : 'Redefinir Sandbox'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOX MANDATÓRIO SAIR DA CONTA (MANDATÓRIO) */}
                  <div className="bg-[#0a0b12] border border-slate-900 rounded-3xl p-6 text-left space-y-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-150">Sessão Operacional</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Encerre sua sessão com segurança para desvincular o painel executivo neste dispositivo</p>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-950 hover:border-transparent rounded-xl py-3.5 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
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
