/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { isDemoMode } from '../../lib/supabase';
import { Profile, PRICING_CONFIG } from '../../types';
import { formatCurrency } from '../../lib/pricing';
import { navigate } from '../../lib/navigation';
import { Shield, Settings, Grid, Calendar, Database, Sparkles, RefreshCw, Info, HelpCircle } from 'lucide-react';

interface SettingsProps {
  currentUser: Profile;
}

export function AdminSettingsView({ currentUser }: SettingsProps) {
  const [resetting, setResetting] = useState(false);

  const handleResetDemoDb = () => {
    if (!isDemoMode) return;
    if (confirm('Deseja realmente apagar todas as viagens inseridas, conversas e restaurar o estado padrão do simulador?')) {
      setResetting(true);
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

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4 md:py-6 page-transition space-y-6 pb-12">
      {/* Header do Admin */}
      <div className="flex justify-between items-center text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-roxou-purple/20 flex items-center justify-center text-roxou-neon">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-100">Configurações</h2>
            <p className="text-[10px] text-slate-400 font-medium">Parâmetros e diagnósticos do sistema</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs bg-roxou-card border border-slate-800 hover:bg-slate-900 rounded-xl px-3 py-1.5 text-slate-400 font-semibold cursor-pointer"
        >
          Visão Cliente
        </button>
      </div>

      {/* Navegação Admin */}
      <div className="grid grid-cols-3 gap-2.5 bg-roxou-card/80 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => navigate('/admin')}
          className="hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Grid className="w-4 h-4" />
          <span>Solicitações</span>
        </button>
        <button
          onClick={() => navigate('/admin/agenda')}
          className="hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => navigate('/admin/configuracoes')}
          className="bg-roxou-purple/20 border border-roxou-purple/30 text-roxou-neon rounded-lg py-2.5 text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Tabela de Preço Fixa */}
      <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-3.5">
        <div className="flex items-center gap-1.5 text-roxou-neon">
          <Database className="w-4 h-4 shrink-0" />
          <h3 className="font-display font-extrabold text-xs uppercase tracking-wider">Configurações de Preços</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Os preços das reservas são calculados de forma determinística utilizando a tabela fixa regulamentada pelo motorista titular:
        </p>

        <div className="space-y-2 text-xs border-t border-slate-850/80 pt-3">
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Tarifa por Km</span>
            <span className="font-bold text-slate-200">{formatCurrency(PRICING_CONFIG.pricePerKm)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Taxa de Reserva de Agenda</span>
            <span className="font-bold text-slate-200">{formatCurrency(PRICING_CONFIG.bookingFee)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900">
            <span className="text-slate-400">Valor Mínimo Cobrado</span>
            <span className="font-bold text-slate-200">{formatCurrency(PRICING_CONFIG.minimumPrice)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Máximo Limite de Passageiros</span>
            <span className="font-bold text-slate-200">{PRICING_CONFIG.maxPassengers} pessoas</span>
          </div>
        </div>
      </div>

      {/* Status do Backend */}
      <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-3">
        <h3 className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Status do Servidor</h3>

        <div className="p-3 bg-slate-900/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Banco de Dados:</span>
            <span className={`font-mono font-bold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isDemoMode ? 'SIMULADO LOCAL' : 'CONECTADO SUPABASE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs transition-all">
            <span className="text-slate-400">Modo de Autenticação:</span>
            <span className="font-mono text-slate-350">{isDemoMode ? 'Guest Switcher / Mock' : 'Google REST API'}</span>
          </div>
        </div>

        {isDemoMode && (
          <div className="pt-2">
            <button
              onClick={handleResetDemoDb}
              disabled={resetting}
              className="w-full bg-[#1e1111] hover:bg-[#2d1515] text-red-400 border border-red-950 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetando...' : 'Resetar Banco de Dados Demo'}</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed">
              Isso apagará o localStorage e recarregará a página com dados demo originais de fábrica para testes limpos.
            </p>
          </div>
        )}
      </div>

      {/* Ajuda / Suporte */}
      <div className="bg-roxou-card border border-slate-850 rounded-2xl p-4 text-left space-y-3">
        <div className="flex items-center gap-1.5 text-slate-405">
          <HelpCircle className="w-4 h-4" />
          <h4 className="font-display font-semibold text-xs text-slate-300">Suporte ao Motorista</h4>
        </div>
        <p className="text-[11px] text-slate-450 leading-relaxed">
          Desenvolvido com carinho para o domínio **reserva.roxou.com.br**.
          Dúvidas sobre o código ou integrações de novos serviços por favor consulte contato técnico.
        </p>
      </div>
    </div>
  );
}
export default AdminSettingsView;
