import React from 'react';
import { TrendingDown, Calendar, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { MonthSummary } from '../types/finance';
import { formatCurrency } from '../services/sheetsParser';

interface MetricCardsProps {
  data: MonthSummary;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ data }) => {
  const percentageSpent = data.incomeTotal > 0
    ? Math.min(100, Math.round((data.totalSpent / data.incomeTotal) * 1000) / 10)
    : 0;

  const isCritical = percentageSpent >= 95;
  const isWarning = percentageSpent >= 80 && percentageSpent < 95;

  return (
    <div className="space-y-2.5">
      {/* Primary Hero Card: Saldo & Progresso do Limite */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-slate-800 shadow-lg">
        {/* Subtle Ambient Background Glow */}
        <div
          className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />

        <div className="space-y-3.5 relative z-10">
          {/* Header Row: Saldo Label & Status Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Saldo Restante ({data.monthName})
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                data.remainingBalance > 500
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : data.remainingBalance > 50
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {data.remainingBalance > 50 ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : (
                <AlertCircle className="w-2.5 h-2.5" />
              )}
              {data.remainingBalance > 500 ? 'Folga Saudável' : data.remainingBalance > 50 ? 'Atenção' : 'No Limite'}
            </span>
          </div>

          {/* Balance Amount */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight num-tabular">
              {formatCurrency(data.remainingBalance)}
            </span>
            <span className="text-xs text-slate-400 shrink-0">
              de <strong className="text-slate-200">{formatCurrency(data.incomeTotal)}</strong>
            </span>
          </div>

          {/* Progress Bar & Spent Amount */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Gasto acumulado:</span>
              <span className="font-semibold text-slate-100 num-tabular text-xs">
                {formatCurrency(data.totalSpent)}{' '}
                <span
                  className={`ml-0.5 font-bold ${
                    isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  ({percentageSpent}%)
                </span>
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isCritical
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : isWarning
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, percentageSpent))}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-400/40 z-10"
                style={{ left: '80%' }}
                title="80%"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>0%</span>
              <span className="text-amber-400/80 font-semibold">Alerta 80%</span>
              <span>100% ({formatCurrency(data.incomeTotal)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact 3-Column Strip for Subtotals (Mobile Fitted) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Gastos Fixos */}
        <div className="card-glass rounded-xl p-2.5 sm:p-3 border border-slate-800/80 space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight truncate">
              Fixos
            </span>
            <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white num-tabular truncate">
              {formatCurrency(data.fixedSpent)}
            </div>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">
              {data.fixedExpenses.length} assinaturas
            </p>
          </div>
        </div>

        {/* Gastos Variáveis */}
        <div className="card-glass rounded-xl p-2.5 sm:p-3 border border-slate-800/80 space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight truncate">
              Variáveis
            </span>
            <TrendingDown className="w-3 h-3 text-indigo-400 shrink-0" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white num-tabular truncate">
              {formatCurrency(data.monthSpent)}
            </div>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">
              {data.transactions.length} compras
            </p>
          </div>
        </div>

        {/* Parcelados */}
        <div className="card-glass rounded-xl p-2.5 sm:p-3 border border-slate-800/80 space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight truncate">
              Parcelas
            </span>
            <CreditCard className="w-3 h-3 text-purple-400 shrink-0" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white num-tabular truncate">
              {formatCurrency(data.cardInstallmentsSpent)}
            </div>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5 truncate">
              {data.installments.length} ativas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
