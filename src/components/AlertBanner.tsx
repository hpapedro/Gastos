import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CategorySummary } from '../types/finance';
import { formatCurrency } from '../services/sheetsParser';

interface AlertBannerProps {
  categories: CategorySummary[];
  totalSpent: number;
  incomeTotal: number;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ categories, totalSpent, incomeTotal }) => {
  const alertedCategories = categories.filter((c) => c.isAlert);
  const totalOver80 = incomeTotal > 0 && totalSpent / incomeTotal >= 0.8;

  if (alertedCategories.length === 0 && !totalOver80) {
    return null;
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-slate-900/60 border border-rose-500/30 p-4 shadow-lg shadow-rose-950/20">
      <div className="flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-rose-200">
              Atenção: Limite de Gastos Atingido ({'>'}80%)
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Crítico
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {totalOver80 && (
              <span>
                O gasto mensal total já consumiu{' '}
                <strong className="text-rose-300 font-bold">
                  {Math.round((totalSpent / incomeTotal) * 100)}%
                </strong>{' '}
                do orçamento previsto.{' '}
              </span>
            )}
            {alertedCategories.length > 0 && (
              <span className="block mt-1">
                Categorias em alerta vermelho:{' '}
                {alertedCategories.map((c) => (
                  <span key={c.name} className="inline-block mr-2 font-medium text-rose-300">
                    • <strong>{c.name}</strong> ({formatCurrency(c.spent)} - {c.percentage}%)
                  </span>
                ))}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
