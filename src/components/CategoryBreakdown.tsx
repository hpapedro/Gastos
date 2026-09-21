import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategorySummary } from '../types/finance';
import { formatCurrency } from '../services/sheetsParser';
import { AlertCircle, Layers } from 'lucide-react';

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  totalSpent: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Contas': '#F43F5E',
  'Desenvolvimento': '#8B5CF6',
  'IFood/restaurante': '#F97316',
  'Ifood/restaurante': '#F97316',
  'Uber/transporte': '#06B6D4',
  'Saúde': '#10B981',
  'Saude': '#10B981',
  'Presentes': '#EC4899',
  'Lazer': '#EAB308',
  'Mercado': '#14B8A6',
  'Assinaturas': '#6366F1',
  'Necessidades': '#64748B',
  'Beleza': '#D946EF',
  'Roupa': '#A855F7',
  'Eletrônicos': '#3B82F6',
  'Outros': '#475569',
};

const PALETTE = [
  '#F43F5E', '#8B5CF6', '#F97316', '#06B6D4', '#10B981',
  '#EC4899', '#EAB308', '#14B8A6', '#6366F1', '#D946EF',
  '#3B82F6', '#A855F7', '#84CC16', '#64748B',
];

function getCategoryColor(name: string, index: number): string {
  const match = Object.keys(CATEGORY_COLORS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (match) return CATEGORY_COLORS[match];
  return PALETTE[index % PALETTE.length];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  categories,
  totalSpent,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = categories.map((c, idx) => ({
    name: c.name,
    value: c.spent,
    percentage: c.percentage,
    color: getCategoryColor(c.name, idx),
    isAlert: c.isAlert,
  }));

  const activeCategory = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className="card-glass rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Gastos por Categoria
          </h2>
          <p className="text-[11px] text-slate-400">
            Distribuição e limite do mês
          </p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {categories.length} categorias
        </span>
      </div>

      {/* Donut Chart (Mobile Fitted) */}
      <div className="relative flex flex-col items-center justify-center min-h-[190px]">
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="card-glass rounded-xl p-2.5 border border-slate-700 shadow-2xl text-xs space-y-0.5">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          {data.name}
                        </div>
                        <div className="text-slate-300 num-tabular font-medium text-[11px]">
                          {formatCurrency(data.value)} ({data.percentage}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={80}
                paddingAngle={2}
                stroke="#090D16"
                strokeWidth={2}
                onClick={(_, index) => setActiveIndex(activeIndex === index ? null : index)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    className="cursor-pointer transition-opacity"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {activeCategory ? (
            <>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                {activeCategory.name}
              </span>
              <span className="text-sm font-bold text-white num-tabular">
                {formatCurrency(activeCategory.value)}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: activeCategory.color }}>
                {activeCategory.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                Total
              </span>
              <span className="text-base font-extrabold text-white num-tabular">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-[9px] text-slate-400">100%</span>
            </>
          )}
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {categories.map((cat, idx) => {
          const color = getCategoryColor(cat.name, idx);
          const isAlert = cat.isAlert;

          return (
            <div
              key={cat.name}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'bg-slate-800/90 border-slate-600'
                  : isAlert
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-slate-200 text-xs truncate">{cat.name}</span>
                  {isAlert && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                      <AlertCircle className="w-2 h-2" />
                      {'>'}80%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 num-tabular shrink-0 text-xs">
                  <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                  <span className="font-semibold text-white">{formatCurrency(cat.spent)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isAlert ? 'bg-rose-500' : ''}`}
                  style={{
                    width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                    backgroundColor: isAlert ? undefined : color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
