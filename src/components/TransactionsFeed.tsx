import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  CreditCard,
  Receipt,
} from 'lucide-react';
import type { Transaction } from '../types/finance';
import { formatCurrency, parseDateToTimestamp } from '../services/sheetsParser';

interface TransactionsFeedProps {
  transactions: Transaction[];
  fixedExpenses: Transaction[];
  installments: Transaction[];
  selectedCard: string | null;
  onSelectCard?: (c: string | null) => void;
}

type TabType = 'transactions' | 'fixed' | 'installments';
type SortOption = 'date-desc' | 'date-asc' | 'val-desc' | 'val-asc';

export const TransactionsFeed: React.FC<TransactionsFeedProps> = ({
  transactions,
  fixedExpenses,
  installments,
  selectedCard,
  onSelectCard,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const rawList = useMemo(() => {
    switch (activeTab) {
      case 'transactions':
        return transactions;
      case 'fixed':
        return fixedExpenses;
      case 'installments':
        return installments;
      default:
        return transactions;
    }
  }, [activeTab, transactions, fixedExpenses, installments]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    rawList.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [rawList]);

  const filteredList = useMemo(() => {
    return rawList
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCard = selectedCard
          ? item.paymentType.toUpperCase().includes(selectedCard.toUpperCase())
          : true;
        const matchesCat =
          categoryFilter === 'all' ? true : item.category === categoryFilter;

        return matchesSearch && matchesCard && matchesCat;
      })
      .sort((a, b) => {
        if (sortOption === 'date-desc') {
          const tB = parseDateToTimestamp(b.date);
          const tA = parseDateToTimestamp(a.date);
          if (tB !== tA) return tB - tA;
          return b.value - a.value;
        }
        if (sortOption === 'date-asc') {
          const tA = parseDateToTimestamp(a.date);
          const tB = parseDateToTimestamp(b.date);
          if (tA !== tB) return tA - tB;
          return a.value - b.value;
        }
        if (sortOption === 'val-desc') {
          return b.value - a.value;
        }
        return a.value - b.value;
      });
  }, [rawList, searchQuery, selectedCard, categoryFilter, sortOption]);

  return (
    <div className="card-glass rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-3.5">
      {/* Header & Segmented Tab Switcher */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Lançamentos
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {filteredList.length} itens
          </span>
        </div>

        {/* Mobile Segmented Control */}
        <div className="grid grid-cols-3 p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-center">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'transactions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gastos ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'fixed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fixos ({fixedExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('installments')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'installments'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parcelas ({installments.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Search */}
        <div className="relative sm:col-span-5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Categoria"
            className="w-full px-2.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Todas categorias</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="sm:col-span-3 flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            aria-label="Ordenar"
            className="w-full bg-transparent text-[11px] text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="date-desc" className="bg-slate-900">Mais recente</option>
            <option value="date-asc" className="bg-slate-900">Mais antigo</option>
            <option value="val-desc" className="bg-slate-900">Maior valor</option>
            <option value="val-asc" className="bg-slate-900">Menor valor</option>
          </select>
        </div>
      </div>

      {/* Native Mobile Banking Feed (List) */}
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5 divide-y divide-slate-800/30">
        {filteredList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          filteredList.map((item) => {
            const isNubank = item.paymentType.toUpperCase().includes('NUBANK');
            const isBB = item.paymentType.toUpperCase().includes('BANCO DO BRASIL');
            const isElo = item.paymentType.toUpperCase().includes('ELO');

            return (
              <div
                key={item.id}
                className="pt-2 pb-1.5 flex items-center justify-between gap-2.5 transition-colors group"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onSelectCard?.(item.paymentType)}
                    title={`Filtrar por ${item.paymentType}`}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 active:scale-90 transition-transform ${
                      isNubank
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : isBB
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : isElo
                        ? 'bg-slate-700/30 text-slate-300 border-slate-600/40'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate leading-tight">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap leading-none">
                      {item.date && (
                        <span className="font-mono text-slate-400">{item.date}</span>
                      )}
                      <span>&bull;</span>
                      <span className="text-slate-300 truncate">{item.category || 'Geral'}</span>
                      {item.installments && (
                        <>
                          <span>&bull;</span>
                          <span className="text-purple-300 font-mono font-medium">{item.installments}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Value */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-white font-mono num-tabular">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
