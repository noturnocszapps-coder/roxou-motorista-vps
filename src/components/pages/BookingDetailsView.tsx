/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../lib/supabase';
import { Profile, RideRequest, RideStatus } from '../../types';
import { getRideStatusConfig } from '../RideCard';
import { formatCurrency } from '../../lib/pricing';
import { ChatComponent } from '../ChatComponent';
import { navigate } from '../../lib/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard,
  User,
  Info,
  Car,
  AlertOctagon,
  LifeBuoy,
  ShieldCheck
} from 'lucide-react';

interface DetailsProps {
  rideId: string;
  currentUser: Profile;
}

export function BookingDetailsView({ rideId, currentUser }: DetailsProps) {
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para formulários do Admin
  const [approvePrice, setApprovePrice] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    let active = true;

    async function loadRide() {
      setLoading(true);
      const data = await supabaseService.getRideRequestById(rideId);
      if (active) {
        setRide(data);
        if (data) {
          setApprovePrice(String(data.estimated_price));
        }
        setLoading(false);
      }
    }

    loadRide();

    // Inscrever-se nas atualizações reais do status desta reserva
    const unsubscribe = supabaseService.subscribeToRideRequest(rideId, (updatedRide) => {
      if (active) {
        setRide(updatedRide);
        setApprovePrice(String(updatedRide.final_price || updatedRide.estimated_price));
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [rideId]);

  const handleUpdateStatus = async (status: RideStatus, finalPrice?: number, reason?: string) => {
    setActionError(null);
    setSubmittingAction(true);
    try {
      const payload: any = { status };
      if (finalPrice !== undefined) payload.final_price = finalPrice;
      if (reason !== undefined) payload.rejection_reason = reason;

      const success = await supabaseService.updateRideRequest(rideId, payload);
      if (success) {
        setShowApproveForm(false);
        setShowRejectForm(false);
        // Recarregar os dados
        const refreshed = await supabaseService.getRideRequestById(rideId);
        setRide(refreshed);
      } else {
        setActionError('Houve um problema de permissão ou conexão ao atualizar o status.');
      }
    } catch (e) {
      setActionError('Ocorreu uma falha ao enviar a alteração.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/minhas-reservas');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto px-4 py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <span className="w-10 h-10 border-4 border-roxou-purple/20 border-t-roxou-purple rounded-full animate-spin" />
        <p className="text-sm font-medium">Buscando detalhes da viagem...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="w-full max-w-sm mx-auto px-4 py-12 text-center text-slate-400 space-y-4">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-display font-bold text-lg text-slate-205">Reserva não encontrada</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          O link está incorreto ou a reserva foi removida dos servidores.
        </p>
        <button
          onClick={handleBack}
          className="bg-slate-900 border border-slate-800 text-xs px-5 py-2.5 rounded-xl text-slate-200"
        >
          Voltar para o Painel
        </button>
      </div>
    );
  }

  const statusCfg = getRideStatusConfig(ride.status);

  // Formata a data dd/mm/yyyy
  const formatDateBr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Determinar índices para a linha do tempo do usuário
  const steps = [
    { key: 'pendente', label: 'Orçamento' },
    { key: 'aprovado', label: 'Aprovado' },
    { key: 'confirmado_pagamento', label: 'Pagamento' },
    { key: 'confirmado_reserva', label: 'Confirmado' },
    { key: 'em_viagem', label: 'Em Viagem' },
    { key: 'concluido', label: 'Concluído' }
  ];

  let currentStepIndex = steps.findIndex(s => s.key === ride.status);
  if (ride.status === 'recusado') {
    currentStepIndex = 1; // Colocar na posição de Orçamento
  } else if (ride.status === 'cancelado') {
    currentStepIndex = -1;
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-5 pb-16">
      {/* Botão de Voltar e Identificador */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl bg-roxou-card border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-left">
          <h2 className="font-display font-extrabold text-base text-slate-100">Reserva Executiva</h2>
          <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
            ID: #{ride.id ? ride.id.slice(0, 8).toUpperCase() : 'ROXOU'}
          </p>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl text-left text-xs text-rose-400">
          {actionError}
        </div>
      )}

      {/* Widget do Status Atual do Pedido */}
      <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 block tracking-wider">Status Atual</span>
            <div className={`mt-1 text-sm font-bold flex items-center gap-1.5 ${statusCfg.textClass}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass}`} />
              <span>{statusCfg.label}</span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block tracking-wider">
              {ride.final_price ? 'Preço Fechado' : 'Orçamento Est.'}
            </span>
            <span className="text-lg font-bold font-display text-roxou-neon">
              {formatCurrency(ride.final_price || ride.estimated_price)}
            </span>
          </div>
        </div>

        {/* Timeline Visual Simplificada */}
        {ride.status !== 'recusado' && ride.status !== 'cancelado' && (
          <div className="pt-2 border-t border-slate-850">
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
              <span>Timeline da Viagem</span>
              <span>{currentStepIndex + 1} de 6</span>
            </div>
            
            <div className="flex items-center justify-between gap-1">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center">
                    <div
                      className={`h-1.5 w-full rounded-full transition-colors ${
                        isPassed
                          ? isCurrent
                            ? 'bg-roxou-purple animate-pulse'
                            : 'bg-roxou-neon'
                          : 'bg-slate-800'
                      }`}
                      title={step.label}
                    />
                    <span className={`text-[8px] mt-1.5 truncate text-center ${isCurrent ? 'text-roxou-neon font-bold' : isPassed ? 'text-slate-300' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensagens de erro/motivo se aplicável */}
        {ride.status === 'recusado' && (
          <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl text-xs text-rose-400 mt-2 text-left">
            <p className="font-bold uppercase tracking-wider text-[9px] text-rose-450">Motivo da Recusa:</p>
            <p className="mt-1 leading-relaxed">{ride.rejection_reason || 'Nenhum motivo detalhado foi fornecido.'}</p>
          </div>
        )}
      </div>

      {/* Cartão de Detalhes da Viagem */}
      <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-4">
        <h3 className="text-[10px] uppercase font-bold text-roxou-neon tracking-wider">Especificações do Trajeto</h3>

        <div className="space-y-3.5">
          <div className="relative pl-6">
            <div className="absolute left-1 top-0 bottom-0 flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-[7px] text-neutral-300">A</div>
              <div className="w-[1px] h-full bg-slate-850" />
            </div>
            <p className="text-[9px] uppercase font-semibold text-slate-500">Embarque (Origem)</p>
            <p className="text-sm font-medium text-slate-205 leading-relaxed">{ride.origin}</p>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-roxou-purple/40 border border-roxou-purple flex items-center justify-center text-[7px] text-white">B</div>
            <p className="text-[9px] uppercase font-semibold text-slate-505">Desembarque (Destino)</p>
            <p className="text-sm font-medium text-slate-250 leading-relaxed">{ride.destination}</p>
          </div>
        </div>

        <hr className="border-slate-850" />

        {/* Parâmetros Horizontal Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1 text-slate-300 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{formatDateBr(ride.scheduled_date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{ride.scheduled_time}h</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{ride.passenger_count} {ride.passenger_count === 1 ? 'passageiro' : 'passageiros'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-roxou-neon font-semibold">
              <TrendingUp className="w-4 h-4 text-slate-505 shrink-0 animate-pulse" />
              <span>{ride.distance_km} Km estimados</span>
            </div>
          </div>
        </div>

        {ride.observation && (
          <div className="pt-3 border-t border-slate-850">
            <p className="text-[9px] uppercase font-semibold text-slate-505">Observações Adicionais</p>
            <p className="text-xs text-slate-300 italic mt-1 leading-relaxed bg-[#0b0c13] p-2.5 rounded-xl border border-slate-900">
              "{ride.observation}"
            </p>
          </div>
        )}

        {/* Perfil do Passageiro para Admin */}
        {isAdmin && ride.profiles && (
          <div className="pt-3 border-t border-slate-850">
            <p className="text-[9px] uppercase font-semibold text-slate-505 mb-2">Informações do Cliente</p>
            <div className="flex items-center gap-2.5 bg-slate-950/40 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs">
                {ride.profiles.full_name?.charAt(0) || 'P'}
              </div>
              <div className="text-left select-text">
                <p className="text-xs font-bold text-slate-200">{ride.profiles.full_name}</p>
                <p className="text-[10px] text-slate-500">{ride.profiles.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações do Motorista & Precificação Detalhada do Chauffeur */}
      {ride.drivers && (
        <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-roxou-neon" />
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chauffeur Luxo Designado</h3>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900/60 rounded-xl p-3">
            <img
              src={ride.drivers.photo_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&h=60&q=80"}
              alt={ride.drivers.display_name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-slate-800 shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-white truncate">{ride.drivers.display_name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ride.drivers.vehicle_model} • <span className="font-mono text-slate-350">{ride.drivers.vehicle_plate}</span></p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-400">Atendimento Corporativo VIP</span>
              </div>
            </div>
          </div>

          {/* Se houver preço detalhado, exibir o memorial de cálculo realista */}
          {ride.base_price !== undefined && ride.base_price !== null && (
            <div className="bg-slate-950/25 border border-slate-900 rounded-xl p-3 space-y-1.5 text-[11px] font-sans">
              <p className="text-[9px] tracking-wider font-semibold text-roxou-neon uppercase mb-2">Detalhamento Financeiro Cláusula Roxou</p>
              
              <div className="flex justify-between text-slate-400">
                <span>Translado Base {ride.distance_km} Km:</span>
                <span className="font-mono text-slate-205">{formatCurrency(ride.base_price)}</span>
              </div>

              {Number(ride.displacement_fee) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Adicional de Escopo / Mobilização:</span>
                  <span className="font-mono text-slate-205">{formatCurrency(Number(ride.displacement_fee))}</span>
                </div>
              )}

              {Number(ride.night_fee) > 0 && (
                <div className="flex justify-between text-indigo-300">
                  <span>Adicional Noturno Executivo:</span>
                  <span className="font-mono">{formatCurrency(Number(ride.night_fee))}</span>
                </div>
              )}

              {Number(ride.stop_fee) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Adicional de Paradas Intermediárias:</span>
                  <span className="font-mono text-slate-205">{formatCurrency(Number(ride.stop_fee))}</span>
                </div>
              )}

              {ride.price_breakdown?.isMinimumApplied && (
                <div className="text-[9px] text-amber-500 bg-amber-500/5 px-2 py-1 rounded border border-amber-900/10 mt-1">
                  Nota: Aplicada tarifa mínima imposta contratualmente por este motorista.
                </div>
              )}

              <hr className="border-slate-800 my-1.5" />

              <div className="flex justify-between items-baseline pt-0.5">
                <span className="text-xs font-bold text-slate-200">Subtotal do Orçamento Realista:</span>
                <span className="text-sm font-extrabold font-display text-roxou-neon">
                  {formatCurrency(ride.final_price || ride.estimated_price)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          PAINEL DE AÇÃO CONTEXTUAL (PASSAGEIRO)
         ========================================== */}
      {!isAdmin && (
        <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-4">
          <h3 className="text-[10px] uppercase font-semibold text-slate-450 tracking-wider">Ações do Passageiro</h3>

          {/* Se aprovado pelo motorista, e aguardando pagamento */}
          {ride.status === 'aprovado' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Pagamento do Orçamento Confirmado</span>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed">
                  Para confirmar seu agendamento, faça a transferência Pix do valor fechado para a chave abaixo:
                </p>
                <div className="bg-[#0b0a13] p-3 rounded-lg border border-indigo-950 select-all font-mono text-xs font-bold flex items-center justify-between text-indigo-300">
                  <span>contato.fh3@gmail.com</span>
                  <span className="text-[9px] font-sans font-semibold bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded">CHAVE PIX</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Após realizar o pagamento, clique no botão confirmar para notificar o motorista e garantir o horário na agenda.
                </p>
              </div>

              <button
                onClick={() => handleUpdateStatus('confirmado_pagamento')}
                disabled={submittingAction}
                className="w-full bg-roxou-purple hover:bg-roxou-neon disabled:bg-slate-800 text-white font-display font-bold text-xs tracking-wide uppercase py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {submittingAction ? 'Enviando...' : 'Confirmar Envio do PIX'}
              </button>
            </div>
          )}

          {/* Caso já aguarde aprovação inicial de orçamento */}
          {ride.status === 'pendente' && (
            <div className="p-3 bg-yellow-500/5 text-yellow-400 text-xs rounded-xl flex gap-2 border border-yellow-905/20 leading-relaxed">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>O orçamento está em análise. O motorista confirmará o preço e horário de partida em breve e notificará você por aqui.</p>
            </div>
          )}

          {/* Confirmações adicionais */}
          {ride.status === 'confirmado_pagamento' && (
            <div className="p-3 bg-emerald-520/5 text-emerald-400 text-xs rounded-xl flex gap-2 border border-emerald-950/20 leading-relaxed">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <p>Seu pagamento PIX foi enviado! Aguarde o motorista validar e consolidar seu agendamento formal na agenda.</p>
            </div>
          )}

          {ride.status === 'confirmado_reserva' && (
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-xl flex gap-2 leading-relaxed">
              <Car className="w-4 h-4 mt-0.5 shrink-0 animate-bounce" />
              <div>
                <p className="font-bold">Sua corrida está confirmada e agendada!</p>
                <p className="text-[11px] text-slate-350 mt-1">O motorista executivo comparecerá ao endereço de origem na data e hora selecionadas.</p>
              </div>
            </div>
          )}

          {ride.status === 'em_viagem' && (
            <div className="p-3 bg-[#a78bfa]/10 text-slate-200 border border-roxou-purple/30 text-xs rounded-xl flex gap-2 leading-relaxed animate-pulse">
              <Car className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-roxou-neon">Viagem Iniciada (Em Andamento)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Aproveite sua jornada executiva privada com segurança total.</p>
              </div>
            </div>
          )}

          {ride.status === 'concluido' && (
            <div className="p-3.5 bg-slate-900 border border-slate-800 text-xs rounded-xl text-slate-400 text-center">
              🎉 Esta viagem executiva foi concluída e finalizada com sucesso! Agradecemos a preferência!
            </div>
          )}

          {/* Cancelamento permitido antes da execução */}
          {ride.status !== 'concluido' && ride.status !== 'cancelado' && ride.status !== 'recusado' && (
            <button
              onClick={() => {
                if (confirm('Tem certeza absoluta que deseja solicitar o cancelamento desta reserva?')) {
                  handleUpdateStatus('cancelado');
                }
              }}
              disabled={submittingAction}
              className="w-full bg-slate-950 hover:bg-red-950/20 text-slate-450 hover:text-rose-500 hover:border-rose-900/40 border border-slate-850 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all mt-2 cursor-pointer"
            >
              Cancelar Solicitação
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          PAINEL DE AÇÃO CONTEXTUAL (ADMINISTRADOR)
         ========================================== */}
      {isAdmin && (
        <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-4">
          <div className="flex items-center gap-1.5 text-roxou-neon">
            <Car className="w-4 h-4 shrink-0" />
            <h3 className="font-display font-extrabold text-xs uppercase tracking-wide">Controle por Motorista / Admin</h3>
          </div>

          {/* Menu de Opções de orçamento pendente */}
          {ride.status === 'pendente' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-350 leading-relaxed">
                Um novo orçamento foi recebido. Selecione se deseja aprovar ou recusar a execução das viagens:
              </p>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveForm(!showApproveForm);
                    setShowRejectForm(false);
                  }}
                  className="flex-1 bg-roxou-purple hover:bg-roxou-neon text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Aprovar Viagem
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(!showRejectForm);
                    setShowApproveForm(false);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Recusar Orçamento
                </button>
              </div>

              {/* Formulário Aprovar */}
              {showApproveForm && (
                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-3 mt-3">
                  <div className="text-xs">
                    <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Confirmar / Editar Preço Final (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 95.00"
                      value={approvePrice}
                      onChange={(e) => setApprovePrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-roxou-purple"
                    />
                    <p className="text-[9px] text-slate-500 mt-1">O cálculo do sistema sugeriu {formatCurrency(ride.estimated_price)}.</p>
                  </div>

                  <button
                    onClick={() => handleUpdateStatus('aprovado', Number(approvePrice) || ride.estimated_price)}
                    disabled={submittingAction}
                    className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {submittingAction ? 'Processando...' : 'Confirmar e Aprovar'}
                  </button>
                </div>
              )}

              {/* Formulário Recusar */}
              {showRejectForm && (
                <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl space-y-3 mt-3">
                  <div className="text-xs">
                    <label className="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Motivo da Recusa</label>
                    <textarea
                      rows={2}
                      placeholder="Informar motivo..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs focus:outline-none focus:border-roxou-purple"
                    />
                  </div>

                  <button
                    onClick={() => handleUpdateStatus('recusado', undefined, rejectionReason.trim() || 'Indisponibilidade de agenda')}
                    disabled={submittingAction}
                    className="w-full bg-rose-600 hover:bg-rose-550 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {submittingAction ? 'Processando...' : 'Recusar Definitivamente'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Confirmar pagamento */}
          {ride.status === 'confirmado_pagamento' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/5 text-amber-300 border border-amber-900/20 rounded-xl text-xs space-y-1">
                <p className="font-bold">⚠️ Confirmação de PIX necessária</p>
                <p>O cliente informou ter realizado o pagamento. Valide os extratos e confirme a reserva executiva para agendá-la formalmente.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('confirmado_reserva')}
                  disabled={submittingAction}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Confirmar Recebimento &amp; Reservar
                </button>
                <button
                  onClick={() => {
                    if (confirm('Reverter para pendente para ajuste do cliente?')) {
                      handleUpdateStatus('aprovado');
                    }
                  }}
                  disabled={submittingAction}
                  className="bg-slate-900 border border-slate-800 text-slate-405 hover:text-white px-3 py-3 rounded-xl text-xs transition-colors cursor-pointer animate-pulse"
                >
                  Rejeitar PIX
                </button>
              </div>
            </div>
          )}

          {/* Confirmado_reserva -> em_viagem */}
          {ride.status === 'confirmado_reserva' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-350">A viagem está na agenda. Clique no botão de partida para iniciar o trajeto executivo:</p>
              <button
                onClick={() => handleUpdateStatus('em_viagem')}
                disabled={submittingAction}
                className="w-full bg-roxou-purple hover:bg-roxou-neon text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer"
              >
                Iniciar Viagem Agora 🏎️
              </button>
            </div>
          )}

          {/* Em_viagem -> concluido */}
          {ride.status === 'em_viagem' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-350 font-semibold text-roxou-neon animate-pulse text-center">🏁 VIAGEM EM ANDAMENTO</p>
              <button
                onClick={() => handleUpdateStatus('concluido')}
                disabled={submittingAction}
                className="w-full bg-indigo-650 hover:bg-indigo-550 border border-indigo-400/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-all cursor-pointer"
              >
                Concluir e Finalizar Corrida 🏁
              </button>
            </div>
          )}

          {/* Status Concluído ou Recusado ou Cancelado */}
          {['concluido', 'recusado', 'cancelado'].includes(ride.status) && (
            <div className="p-3 border border-slate-800 bg-slate-900/30 text-xs rounded-xl text-slate-500 text-center select-none font-mono">
              ESTA RESERVA FOI ENCERRADA • HISTÓRICO CONSOLIDADO
            </div>
          )}

          {/* Cancelamento administrativo disponível a qualquer momento para viagens ativas */}
          {!['concluido', 'recusado', 'cancelado'].includes(ride.status) && (
            <button
              onClick={() => {
                if (confirm('Deseja realmente cancelar esta reserva como administrador?')) {
                  handleUpdateStatus('cancelado');
                }
              }}
              disabled={submittingAction}
              className="w-full bg-slate-950 border border-rose-950 hover:bg-rose-950/20 hover:text-rose-450 hover:border-rose-900/30 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 uppercase mt-1"
            >
              Cancelar/Excluir Agendamento
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          COMPONENT INTEGRADOR DE CHAT INTERNO
         ========================================== */}
      {/* O chat fica liberado em qualquer reserva válida */}
      {ride.id && (
        <ChatComponent rideId={ride.id} currentUser={currentUser} />
      )}
    </div>
  );
}
export default BookingDetailsView;
