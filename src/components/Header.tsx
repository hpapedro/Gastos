import React from 'react';
import { RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import type { MonthOption } from '../types/finance';

interface HeaderProps {
  months: MonthOption[];
  selectedMonth: MonthOption;
  onSelectMonth: (m: MonthOption) => void;
  isSyncing: boolean;
  lastUpdated?: string;
  onRefresh: () => void;
  spreadsheetUrl: string;
}

export const Header: React.FC<HeaderProps> = ({
  months,
  selectedMonth,
  onSelectMonth,
  isSyncing,
  lastUpdated,
  onRefresh,
  spreadsheetUrl,
}) => {
  return (
    <header
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 52px) + 8px)',
      }}
      className="border-b border-slate-800/80 bg-[#0B0F19]/95 backdrop-blur-xl sticky top-0 z-40 px-3.5 sm:px-6 pb-2.5 transition-all shadow-md"
    >
      <div className="max-w-md sm:max-w-xl md:max-w-7xl mx-auto space-y-2.5">
        
        {/* Top Row: App Brand & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 via-slate-800 to-slate-900 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-base font-bold text-white tracking-tight">FinTrack</h1>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span>{isSyncing ? 'Sincronizando...' : `${lastUpdated || 'Ao vivo'}`}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Sync + Open Sheet) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-slate-700/80 text-xs font-semibold text-slate-200 transition disabled:opacity-50 cursor-pointer shadow-sm"
              title="Sincronizar dados da planilha"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="text-[11px] font-semibold">{isSyncing ? '...' : 'Sincronizar'}</span>
            </button>

            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Abrir planilha no Google Sheets"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Row: Month Selector Horizontal Scroll Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar -mx-1 px-1">
          {months.map((m) => {
            const isSelected = m.gid === selectedMonth.gid;
            return (
              <button
                key={m.gid}
                onClick={() => onSelectMonth(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
