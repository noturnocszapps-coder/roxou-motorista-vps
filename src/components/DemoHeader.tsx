/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { isDemoMode, supabaseService } from '../lib/supabase';
import { Profile } from '../types';
import { Shield, Sparkles, User, Database, Info } from 'lucide-react';

interface DemoProps {
  currentUser: Profile | null;
  onRefreshUser: () => void;
}

export function DemoHeader({ currentUser, onRefreshUser }: DemoProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const handleToggleRole = (role: 'admin' | 'passageiro') => {
    if (role === 'admin') {
      supabaseService.demoLoginAs('admin', 'contato.fh3@gmail.com');
    } else {
      supabaseService.demoLoginAs('passageiro', 'passageiro@exemplo.com');
    }
    onRefreshUser();
  };

  if (!isDemoMode) {
    return (
      <div className="bg-roxou-card/80 border-b border-roxou-purple/20 px-4 py-2 text-xs text-slate-400 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-1.5 font-medium text-purple-400">
          <Database className="w-3.5 h-3.5 text-roxou-green animate-pulse" />
          <span>Conectado ao Supabase Real</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 uppercase tracking-wider font-semibold">
            {currentUser?.role === 'admin' ? 'Admin' : 'Passageiro'}
          </span>
          <span className="text-slate-300 font-mono text-[11px] font-medium">{currentUser?.email}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#18122c] border-b border-roxou-purple/30 z-50 sticky top-0 text-xs">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 font-medium text-roxou-neon hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
          <span>Modo Demo Ativo</span>
          <Info className="w-3.5 h-3.5 text-[0.8em]" />
        </button>

        <div className="flex items-center gap-1 bg-[#100a1f] p-0.5 rounded-lg border border-purple-900/40">
          <button
            onClick={() => handleToggleRole('passageiro')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
              currentUser?.role === 'passageiro'
                ? 'bg-roxou-purple text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Passageiro</span>
          </button>
          <button
            onClick={() => handleToggleRole('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
              currentUser?.role === 'admin'
                ? 'bg-roxou-purple text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {showExplanation && (
        <div className="bg-[#120e24] border-t border-purple-900/30 px-5 py-3 text-slate-300 max-w-md mx-auto">
          <p className="mb-2 leading-relaxed">
            Este aplicativo está rodando em **Modo de Demonstração** porque as chaves do Supabase no <code className="bg-purple-950/60 px-1 py-0.5 rounded text-yellow-400">.env</code> não foram configuradas.
          </p>
          <p className="mb-2 leading-relaxed">
            Todas as ações de reserva, alteração de status do motorista e chat funcionam **em tempo real** no seu navegador simulando o Supabase. Use o botão acima para alternar de perfil.
          </p>
          <div className="mt-2 text-yellow-300 text-[10px] font-mono p-1.5 bg-yellow-950/40 rounded border border-yellow-800/20">
            Dica: abra duas guias se quiser testar a alternância reativa completa!
          </div>
        </div>
      )}
    </div>
  );
}
