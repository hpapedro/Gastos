import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { AlertBanner } from './components/AlertBanner';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { CardsBreakdown } from './components/CardsBreakdown';
import { TransactionsFeed } from './components/TransactionsFeed';
import { KNOWN_MONTHS, SPREADSHEET_WEB_URL } from './types/finance';
import type { MonthOption, MonthSummary } from './types/finance';
import { fetchMonthData } from './services/sheetsParser';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

export function App() {
  // Default to Outubro or Setembro
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(
    KNOWN_MONTHS.find((m) => m.name === 'Outubro') ||
    KNOWN_MONTHS.find((m) => m.name === 'Setembro') ||
    KNOWN_MONTHS[0]
  );
  const [monthData, setMonthData] = useState<MonthSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load data for the selected month
  const loadData = useCallback(
    async (isBackground = false, forceRefresh = false) => {
      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }
      setErrorMsg(null);

      try {
        const data = await fetchMonthData(selectedMonth.name, selectedMonth.gid, forceRefresh);
        setMonthData(data);
      } catch (err) {
        console.error('Failed to load sheet data', err);
        setErrorMsg('Não foi possível conectar ao Google Sheets no momento. Usando dados em cache.');
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [selectedMonth]
  );

  useEffect(() => {
    loadData(false, false);
  }, [loadData]);

  // Periodic polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true, true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300 antialiased">
      {/* Top Sticky Header with Safe-Area padding for iPhone */}
      <Header
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => {
          setSelectedMonth(m);
          setSelectedCard(null);
        }}
        isSyncing={isSyncing}
        lastUpdated={monthData?.lastUpdated}
        onRefresh={() => loadData(true, true)}
        spreadsheetUrl={SPREADSHEET_WEB_URL}
      />

      {/* Main Content Dashboard - Mobile-Fitted Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-3.5 py-3.5 space-y-3 pb-safe">
        
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !monthData ? (
          <div className="h-80 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            <p className="text-xs font-medium">Carregando {selectedMonth.name} do Google Sheets...</p>
          </div>
        ) : monthData ? (
          <>
            {/* 1. Metric Cards (Saldo, Barra de Limite e 3 Subtotais em Strip Horizontal) */}
            <MetricCards data={monthData} />

            {/* 2. Alert Banner for Categories or Total > 80% */}
            <AlertBanner
              categories={monthData.categories}
              totalSpent={monthData.totalSpent}
              incomeTotal={monthData.incomeTotal}
            />

            {/* 3. Visual Breakdown: Categories Donut & Progress List */}
            <CategoryBreakdown
              categories={monthData.categories}
              totalSpent={monthData.totalSpent}
            />

            {/* 4. Interactive Credit Cards (2x2 Compact Mobile Grid) */}
            <CardsBreakdown
              paymentMethods={monthData.paymentMethods}
              totalSpent={monthData.totalSpent}
              selectedCard={selectedCard}
              onSelectCard={setSelectedCard}
            />

            {/* 5. Mobile Native Transaction Feed */}
            <TransactionsFeed
              transactions={monthData.transactions}
              fixedExpenses={monthData.fixedExpenses}
              installments={monthData.installments}
              selectedCard={selectedCard}
              onSelectCard={setSelectedCard}
            />
          </>
        ) : null}
      </main>

      {/* Mobile-Fitted Footer */}
      <footer className="border-t border-slate-800/60 bg-[#0B0F19] py-4 px-3 text-center text-[11px] text-slate-500 pb-safe">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span className="text-[10px]">Google Sheets Conectado</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-[10px]">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>FinTrack Mobile</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
