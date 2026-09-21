import React from 'react';
import { CreditCard, Check, Wifi } from 'lucide-react';
import type { PaymentTypeSummary } from '../types/finance';
import { formatCurrency } from '../services/sheetsParser';

interface CardsBreakdownProps {
  paymentMethods: PaymentTypeSummary[];
  totalSpent: number;
  selectedCard: string | null;
  onSelectCard: (cardName: string | null) => void;
}

interface CardVisualConfig {
  gradient: string;
  borderColor: string;
  chipColor: string;
  badge: string;
}

const CARD_STYLES: Record<string, CardVisualConfig> = {
  NUBANK: {
    gradient: 'from-[#8A05BE]/40 via-[#530082]/30 to-[#2A0045]/60',
    borderColor: 'border-[#A855F7]/40',
    chipColor: 'bg-purple-300/40',
    badge: 'Nubank',
  },
  'BANCO DO BRASIL': {
    gradient: 'from-[#003882]/40 via-[#0B2545]/40 to-[#FFCC00]/10',
    borderColor: 'border-blue-500/40',
    chipColor: 'bg-amber-300/40',
    badge: 'Banco do Brasil',
  },
  'BB ELO MAIS': {
    gradient: 'from-[#27272A]/80 via-[#18181B]/80 to-[#09090B]',
    borderColor: 'border-slate-600/40',
    chipColor: 'bg-slate-300/30',
    badge: 'BB Elo Mais',
  },
  'BB ELO Mais': {
    gradient: 'from-[#27272A]/80 via-[#18181B]/80 to-[#09090B]',
    borderColor: 'border-slate-600/40',
    chipColor: 'bg-slate-300/30',
    badge: 'BB Elo Mais',
  },
  Débito: {
    gradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
    borderColor: 'border-emerald-500/40',
    chipColor: 'bg-emerald-300/30',
    badge: 'Débito',
  },
};

const DEFAULT_CARD_STYLE: CardVisualConfig = {
  gradient: 'from-slate-800/50 via-slate-900 to-slate-950',
  borderColor: 'border-slate-700/40',
  chipColor: 'bg-slate-400/20',
  badge: 'Cartão',
};

export const CardsBreakdown: React.FC<CardsBreakdownProps> = ({
  paymentMethods,
  totalSpent,
  selectedCard,
  onSelectCard,
}) => {
  return (
    <div className="card-glass rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-purple-400" />
          Gastos por Cartão
        </h2>

        {selectedCard && (
          <button
            onClick={() => onSelectCard(null)}
            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Limpar ({selectedCard})
          </button>
        )}
      </div>

      {/* 2x2 Grid for Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {paymentMethods.map((pm) => {
          const config = CARD_STYLES[pm.name] || DEFAULT_CARD_STYLE;
          const isSelected = selectedCard === pm.name;
          const percentage = totalSpent > 0 ? Math.round((pm.spent / totalSpent) * 100) : 0;

          return (
            <div
              key={pm.name}
              onClick={() => onSelectCard(isSelected ? null : pm.name)}
              className={`relative rounded-xl p-3 cursor-pointer transition-all duration-150 border bg-gradient-to-br ${
                config.gradient
              } ${
                isSelected
                  ? 'ring-2 ring-emerald-400 border-transparent scale-[1.02] shadow-lg'
                  : config.borderColor
              } active:scale-95`}
            >
              {/* Card top */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-3 rounded-xs border border-white/20 ${config.chipColor}`} />
                  <Wifi className="w-2.5 h-2.5 text-white/40 rotate-90" />
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-black/40 text-white/80">
                  {config.badge}
                </span>
              </div>

              {/* Card middle: Amount */}
              <div className="my-1">
                <div className="text-xs sm:text-sm font-bold text-white num-tabular truncate">
                  {formatCurrency(pm.spent)}
                </div>
              </div>

              {/* Card bottom: Percentage & Status */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                <span className="text-slate-400 font-medium">{percentage}%</span>
                {isSelected ? (
                  <span className="inline-flex items-center gap-0.5 font-bold text-emerald-400 text-[10px]">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                ) : (
                  <span className="text-slate-500">Filtrar</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
