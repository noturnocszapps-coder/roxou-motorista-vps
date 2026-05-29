/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DriverStatusType } from '../types';
import { Circle, Moon, UserCheck, EyeOff } from 'lucide-react';

interface WidgetProps {
  status: DriverStatusType;
  showIcon?: boolean;
}

export function DriverStatusWidget({ status, showIcon = true }: WidgetProps) {
  const config = {
    online: {
      text: 'Online',
      sub: 'Disponível na cidade',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      dotClass: 'bg-emerald-500 shadow-neon-green animate-pulse',
      icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
    },
    ocupado: {
      text: 'Ocupado',
      sub: 'Em corrida particular',
      bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      dotClass: 'bg-amber-400',
      icon: <Moon className="w-4 h-4 text-amber-400" />,
    },
    offline: {
      text: 'Offline',
      sub: 'Indisponível no momento',
      bgClass: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
      dotClass: 'bg-slate-500',
      icon: <EyeOff className="w-4 h-4 text-slate-400" />,
    },
  };

  const current = config[status] || config.offline;

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${current.bgClass}`}>
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="w-8 h-8 rounded-full bg-slate-900/50 flex items-center justify-center border border-current/10">
            {current.icon}
          </div>
        )}
        <div className="text-left">
          <p className="font-display font-bold text-sm tracking-wide uppercase">Motorista {current.text}</p>
          <p className="text-xs text-slate-400">{current.sub}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${current.dotClass}`} />
      </div>
    </div>
  );
}
export default DriverStatusWidget;
