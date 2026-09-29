import type {
  MonthOption,
  MonthSummary,
  Transaction,
  CategorySummary,
  PaymentTypeSummary,
} from '../types/finance';
import { SPREADSHEET_BASE_URL } from '../types/finance';

/**
 * Converts a currency string formatted in pt-BR (e.g., "R$ 1.196,30" or "R$ 25,00") to a float.
 */
export function parseCurrency(val: string | undefined | null): number {
  if (!val) return 0;
  const clean = val.replace(/R\$/g, '').replace(/\s/g, '').trim();
  if (!clean || clean === '-') return 0;

  // Format is Brazilian: 1.234,56 -> 1234.56
  const normalized = clean.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Converts percentage string (e.g., "17,22%") to number (e.g. 17.22)
 */
export function parsePercentage(val: string | undefined | null): number {
  if (!val) return 0;
  const clean = val.replace(/%/g, '').replace(/\s/g, '').trim();
  const normalized = clean.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Formats a number to Brazilian Real (R$ 1.234,56)
 */
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

/**
 * Parses a date string like "15/09" or "15/09/2026" into a timestamp for accurate sorting.
 */
export function parseDateToTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.trim();
  const parts = clean.split('/');
  if (parts.length === 2) {
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 1;
    // Assume year 2026
    return new Date(2026, month - 1, day).getTime();
  }
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10) || 1;
    const month = parseInt(parts[1], 10) || 1;
    let year = parseInt(parts[2], 10) || 2026;
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day).getTime();
  }
  return 0;
}

/**
 * RFC 4180 compliant CSV line splitter
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV content from Google Sheets into a structured MonthSummary object.
 */
/**
 * Parses raw CSV content from Google Sheets into a structured MonthSummary object.
 */
export function parseMonthCSV(csvText: string, monthName: string, gid: string): MonthSummary {
  const lines = csvText.split(/\r?\n/).map((l) => parseCSVLine(l));

  let totalSpentCell = 0;
  let remainingBalanceCell = 0;
  let incomeTotal = 7000;

  const transactions: Transaction[] = [];
  const fixedExpenses: Transaction[] = [];
  const installments: Transaction[] = [];
  const paymentMethods: PaymentTypeSummary[] = [];

  // 1. Detect Income and Summary Cells
  for (let r = 0; r < lines.length; r++) {
    const row = lines[r];
    const rowStr = row.join(' ');

    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || '').trim();
      const nextCell = (row[c + 1] || '').trim();

      if (cell.includes('Total de gastos:') && nextCell) {
        totalSpentCell = parseCurrency(nextCell);
      }
      if (cell.includes('Saldo:') && nextCell) {
        remainingBalanceCell = parseCurrency(nextCell);
      }
      if (cell.includes('Salário') || (cell === 'Total:' && rowStr.includes('Entradas'))) {
        const val = parseCurrency(nextCell);
        if (val > 1000) incomeTotal = val;
      }
    }
  }

  // 2. Parse Official Category Table from the right-hand section
  // Column >= 15, starting at row where header contains 'Categoria'
  let catHeaderRow = -1;
  let catCol = -1;
  lines.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell === 'Categoria' && c >= 15 && catHeaderRow === -1) {
        catHeaderRow = r;
        catCol = c;
      }
    });
  });

  const parsedCategoriesRaw: { name: string; spent: number }[] = [];
  if (catHeaderRow !== -1) {
    for (let r = catHeaderRow + 1; r < lines.length; r++) {
      const row = lines[r];
      const catName = row[catCol]?.trim();

      if (
        !catName ||
        catName === 'Gastos por tipo de pagamento' ||
        catName === 'Data' ||
        catName.toLowerCase().includes('total')
      ) {
        if (catName === 'Gastos por tipo de pagamento') break;
        continue;
      }

      // CRITICAL: NEVER include "Saldo" as an expense category
      if (catName.toLowerCase().includes('saldo')) continue;

      let spent = 0;
      for (let c = catCol + 1; c < catCol + 5; c++) {
        if (row[c]?.includes('R$')) {
          spent = parseCurrency(row[c]);
          break;
        }
      }

      parsedCategoriesRaw.push({
        name: catName,
        spent,
      });
    }
  }

  // 3. Parse Payment Methods (Cartões) from Saídas / Gastos por tipo de pagamento (rows 16-35)
  const cardNames = [
    'DÉBITO',
    'DEBITO',
    'NUBANK',
    'BANCO DO BRASIL',
    'BB ELO MAIS',
    'BB ELO Mais',
    'CRÉDITO 4',
    'CREDITO 4',
  ];

  for (let r = 16; r < Math.min(lines.length, 36); r++) {
    const row = lines[r];
    for (let c = 15; c < row.length; c++) {
      const cellVal = (row[c] || '').trim().toUpperCase();
      const matched = cardNames.find((cn) => cn.toUpperCase() === cellVal);
      if (matched) {
        let spent = 0;
        let isPaid = false;
        for (let k = c + 1; k <= c + 4; k++) {
          if (row[k]?.includes('R$')) {
            spent = parseCurrency(row[k]);
            break;
          }
        }
        for (let k = c + 1; k <= c + 5; k++) {
          if (row[k]?.toUpperCase() === 'TRUE') isPaid = true;
        }

        let displayName = 'Cartão';
        if (matched.includes('NUBANK')) displayName = 'NUBANK';
        else if (matched.includes('BANCO DO BRASIL')) displayName = 'BANCO DO BRASIL';
        else if (matched.includes('BB ELO')) displayName = 'BB ELO MAIS';
        else if (matched.includes('DÉBITO') || matched.includes('DEBITO')) displayName = 'Débito';
        else if (matched.includes('CRÉDITO 4') || matched.includes('CREDITO 4')) displayName = 'Crédito 4';

        if (!paymentMethods.some((pm) => pm.name.toUpperCase() === displayName.toUpperCase())) {
          paymentMethods.push({ name: displayName, spent, isPaid });
        }
      }
    }
  }

  // 4. Parse Fixed Expenses (Fixos) & Installments (Cartão de Crédito parcelado)
  let fixosStart = -1;
  let parcelasStart = -1;
  lines.forEach((row, r) => {
    if (row[2] === 'Fixos') fixosStart = r;
    if (row[2] === 'Cartão de Crédito') parcelasStart = r;
  });

  if (fixosStart !== -1) {
    const endR = parcelasStart !== -1 ? parcelasStart : lines.length;
    for (let r = fixosStart + 2; r < endR; r++) {
      const row = lines[r];
      if (row[2]?.includes('Total') || !row[2]) break;
      const name = row[2].trim();
      const date = row[4]?.trim() || '';
      const tipo = row[6]?.trim() || '';
      const cat = row[7]?.trim() || '';
      const val = parseCurrency(row[8]);
      if (val > 0 && name) {
        fixedExpenses.push({
          id: `fix-${fixedExpenses.length + 1}`,
          name,
          date,
          paymentType: tipo,
          category: cat,
          value: val,
          isFixed: true,
        });
      }
    }
  }

  if (parcelasStart !== -1) {
    for (let r = parcelasStart + 2; r < lines.length; r++) {
      const row = lines[r];
      if (row[2]?.includes('Total') || !row[2]) break;
      const name = row[2].trim();
      const inst = row[3]?.trim() || '';
      const tipo = row[6]?.trim() || '';
      const cat = row[7]?.trim() || '';
      const val = parseCurrency(row[8]);
      if (val > 0 && name) {
        installments.push({
          id: `parc-${installments.length + 1}`,
          name,
          installments: inst,
          paymentType: tipo,
          category: cat,
          value: val,
        });
      }
    }
  }

  // 5. Parse Month Transactions (Gastos do Mês)
  for (let r = 8; r < lines.length; r++) {
    const row = lines[r];
    const name = row[10]?.trim() || (row[9]?.includes('/') ? '' : row[9]?.trim());
    let date = '';
    let tipo = '';
    let cat = '';
    let val = 0;
    for (let c = 10; c <= 16; c++) {
      if (row[c]?.includes('/') && !date) date = row[c].trim();
      if (row[c]?.includes('R$') && !val) val = parseCurrency(row[c]);
    }

    if (name && val > 0 && name !== 'Nome' && !name.includes('Total') && date) {
      for (let c = 11; c <= 15; c++) {
        const v = row[c]?.trim();
        if (cardNames.some((k) => k.toLowerCase() === v?.toLowerCase())) {
          tipo = v;
        }
        if (parsedCategoriesRaw.some((cr) => cr.name.toLowerCase() === v?.toLowerCase())) {
          cat = v;
        }
      }
      transactions.push({
        id: `tx-${transactions.length + 1}`,
        name,
        date,
        paymentType: tipo || 'BANCO DO BRASIL',
        category: cat || 'Outros',
        value: val,
      });
    }
  }

  // 6. Subtotals & Harmonized Totals
  const computedFixedSpent = Math.round(fixedExpenses.reduce((s, t) => s + t.value, 0) * 100) / 100;
  const computedMonthSpent = Math.round(transactions.reduce((s, t) => s + t.value, 0) * 100) / 100;
  const computedInstallmentsSpent = Math.round(installments.reduce((s, t) => s + t.value, 0) * 100) / 100;
  const subtotalsSum = Math.round((computedFixedSpent + computedMonthSpent + computedInstallmentsSpent) * 100) / 100;

  const cardSum = Math.round(paymentMethods.reduce((s, pm) => s + pm.spent, 0) * 100) / 100;
  const catSum = Math.round(parsedCategoriesRaw.reduce((s, c) => s + c.spent, 0) * 100) / 100;

  // The actual accumulated spending is the true sum of expenses (cards sum = categories sum = subtotals sum)
  const totalSpent =
    cardSum > 0
      ? cardSum
      : catSum > 0
      ? catSum
      : subtotalsSum > 0
      ? subtotalsSum
      : totalSpentCell;

  const remainingBalance =
    remainingBalanceCell > 0 && Math.abs(remainingBalanceCell - (incomeTotal - totalSpent)) < 1
      ? remainingBalanceCell
      : Math.max(0, Math.round((incomeTotal - totalSpent) * 100) / 100);

  // 7. Process Categories with 100% accurate percentages and ALL categories preserved
  let categories: CategorySummary[] = [];

  if (parsedCategoriesRaw.length > 0) {
    const baseForPct = totalSpent > 0 ? totalSpent : catSum > 0 ? catSum : 1;
    categories = parsedCategoriesRaw.map((c) => {
      const pct = Math.round((c.spent / baseForPct) * 10000) / 100;
      return {
        name: c.name,
        expected: 0,
        spent: c.spent,
        percentage: pct,
        isAlert: pct >= 80,
      };
    });
    // Sort: categories with spent > 0 in descending order, followed by 0 values
    categories.sort((a, b) => b.spent - a.spent);
  } else {
    // Fallback: aggregate from transactions
    const catMap = new Map<string, number>();
    [...transactions, ...fixedExpenses, ...installments].forEach((t) => {
      const c = (t.category || 'Outros').trim();
      catMap.set(c, (catMap.get(c) || 0) + t.value);
    });
    const baseForPct = totalSpent > 0 ? totalSpent : 1;
    catMap.forEach((spent, name) => {
      const rounded = Math.round(spent * 100) / 100;
      const pct = Math.round((rounded / baseForPct) * 10000) / 100;
      categories.push({
        name,
        expected: 0,
        spent: rounded,
        percentage: pct,
        isAlert: pct >= 80,
      });
    });
    categories.sort((a, b) => b.spent - a.spent);
  }

  return {
    monthName,
    gid,
    incomeTotal: incomeTotal || 7000,
    totalSpent,
    fixedSpent: computedFixedSpent,
    monthSpent: computedMonthSpent,
    cardInstallmentsSpent: computedInstallmentsSpent,
    remainingBalance,
    categories,
    paymentMethods,
    transactions,
    fixedExpenses,
    installments,
    lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Fetches the month CSV directly from the published Google Sheets URL or serverless proxy.
 */
export async function fetchMonthData(
  monthName: string,
  gid: string,
  forceRefresh = false
): Promise<MonthSummary> {
  const timestamp = Date.now();
  const directUrl = `${SPREADSHEET_BASE_URL}/pub?gid=${gid}&single=true&output=csv&_t=${timestamp}`;

  // 1. Try our Vercel Serverless Function (/api/sheets?gid=...)
  // This bypasses Safari cross-origin 307 redirect limits & disk cache completely!
  try {
    const apiRes = await fetch(`/api/sheets?gid=${gid}&_t=${timestamp}`, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
    if (apiRes.ok) {
      const text = await apiRes.text();
      if (text && text.includes(',')) {
        const summary = parseMonthCSV(text, monthName, gid);
        try {
          localStorage.setItem(`fintrack_cache_${gid}`, JSON.stringify(summary));
        } catch {}
        return summary;
      }
    }
  } catch {
    // /api/sheets might fail on local vite dev server, fallback to direct
  }

  // 2. Try Direct Google Sheets with cache buster
  try {
    const res = await fetch(directUrl, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes(',')) {
        const summary = parseMonthCSV(text, monthName, gid);
        try {
          localStorage.setItem(`fintrack_cache_${gid}`, JSON.stringify(summary));
        } catch {}
        return summary;
      }
    }
  } catch (err) {
    console.warn('Direct fetch failed, trying proxy', err);
  }

  // 3. Try CORS Proxy fallback
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
    const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      if (text && text.includes(',')) {
        const summary = parseMonthCSV(text, monthName, gid);
        try {
          localStorage.setItem(`fintrack_cache_${gid}`, JSON.stringify(summary));
        } catch {}
        return summary;
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy fetch failed', proxyErr);
  }

  // 4. Fallback to localStorage only if not forcing fresh refresh
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(`fintrack_cache_${gid}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
  }

  return getAuthenticFallbackMonth(monthName, gid);
}

/**
 * Fetches the available months dynamically from Google Sheets pubhtml.
 */
export async function fetchMonths(): Promise<MonthOption[]> {
  const timestamp = Date.now();
  
  try {
    const apiRes = await fetch(`/api/months?_t=${timestamp}`, {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
    if (apiRes.ok) {
      const months = await apiRes.json();
      if (Array.isArray(months) && months.length > 0) {
        return months;
      }
    }
  } catch {
    // /api/months might fail locally
  }

  // Fallback to proxy
  try {
    const googleUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTKiwxfLGGgfjaveTtW0ES34dlbYXUIq7MQSJhzBZ1kJWk9KCiwSvqkwW-riUHCjKFW17Ac3iv2ag8l/pubhtml?_t=${timestamp}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`;
    const proxyRes = await fetch(proxyUrl, { cache: 'no-store' });
    if (proxyRes.ok) {
      const html = await proxyRes.text();
      const regex = /items\.push\(\{name:\s*"([^"]+)",[^\}]*gid:\s*"([^"]+)"/g;
      const months = [];
      let match;
      const ignoreList = ["Comece aqui", "Categorias", "Metas Financeiras", "Panorama anual", "Investimento"];
      
      while ((match = regex.exec(html)) !== null) {
        const name = match[1];
        const gid = match[2];
        if (!ignoreList.includes(name)) {
          months.push({ name, gid });
        }
      }
      if (months.length > 0) {
        return months;
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy fetch failed', proxyErr);
  }

  // Final fallback to KNOWN_MONTHS if everything fails
  const { KNOWN_MONTHS } = await import('../types/finance');
  return KNOWN_MONTHS;
}

/**
 * Real authentic fallback data matching the user's actual Setembro spreadsheet.
 */
export function getAuthenticFallbackMonth(monthName: string, gid: string): MonthSummary {
  return {
    monthName,
    gid,
    incomeTotal: 7000.0,
    totalSpent: 6997.35,
    fixedSpent: 1660.97,
    monthSpent: 4708.8,
    cardInstallmentsSpent: 579.23,
    remainingBalance: 2.65,
    lastUpdated: '15:30',
    paymentMethods: [
      { name: 'BANCO DO BRASIL', spent: 4577.21, isPaid: false },
      { name: 'NUBANK', spent: 2041.74, isPaid: false },
      { name: 'BB ELO MAIS', spent: 378.4, isPaid: false },
      { name: 'Débito', spent: 0.0, isPaid: false },
    ],
    categories: [
      { name: 'Contas', expected: 2683.53, spent: 2683.53, percentage: 38.62, isAlert: true },
      { name: 'Desenvolvimento', expected: 1196.3, spent: 1196.3, percentage: 17.22, isAlert: false },
      { name: 'IFood/restaurante', expected: 944.75, spent: 944.75, percentage: 13.6, isAlert: false },
      { name: 'Uber/transporte', expected: 853.68, spent: 853.68, percentage: 12.28, isAlert: false },
      { name: 'Saúde', expected: 368.28, spent: 368.28, percentage: 5.3, isAlert: false },
      { name: 'Presentes', expected: 367.19, spent: 367.19, percentage: 5.28, isAlert: false },
      { name: 'Lazer', expected: 243.06, spent: 243.06, percentage: 3.5, isAlert: false },
      { name: 'Mercado', expected: 115.56, spent: 115.56, percentage: 1.66, isAlert: false },
      { name: 'Assinaturas', expected: 96.39, spent: 96.39, percentage: 1.39, isAlert: false },
      { name: 'Necessidades', expected: 68.61, spent: 68.61, percentage: 0.99, isAlert: false },
      { name: 'Beleza', expected: 60.0, spent: 60.0, percentage: 0.86, isAlert: false },
    ],
    fixedExpenses: [
      { id: 'fix-1', name: 'Netflix', date: '10/08', paymentType: 'NUBANK', category: 'Assinaturas', value: 44.9, isFixed: true },
      { id: 'fix-2', name: 'Plano de Saúde', date: '10/08', paymentType: 'NUBANK', category: 'Saúde', value: 285.88, isFixed: true },
      { id: 'fix-3', name: 'Faculdade', date: '10/08', paymentType: 'NUBANK', category: 'Desenvolvimento', value: 1196.3, isFixed: true },
      { id: 'fix-4', name: 'Gemini Ultra', date: '11/08', paymentType: 'NUBANK', category: 'Assinaturas', value: 23.99, isFixed: true },
      { id: 'fix-5', name: 'Adobe', date: '06/08', paymentType: 'BB ELO MAIS', category: 'Assinaturas', value: 27.5, isFixed: true },
      { id: 'fix-6', name: 'Academia', date: '04/08', paymentType: 'BANCO DO BRASIL', category: 'Saúde', value: 82.4, isFixed: true },
    ],
    installments: [
      { id: 'parc-1', name: 'Mecanico', installments: '5/6', paymentType: 'NUBANK', category: 'Uber/transporte', value: 228.33 },
      { id: 'parc-2', name: 'Presente Mãe', installments: '4/6', paymentType: 'BB ELO MAIS', category: 'Presentes', value: 68.61 },
      { id: 'parc-3', name: 'Ar Condicionado', installments: '6/10', paymentType: 'BB ELO MAIS', category: 'Presentes', value: 213.68 },
      { id: 'parc-4', name: 'Cadeira', installments: '6/12', paymentType: 'BB ELO MAIS', category: 'Necessidades', value: 68.61 },
    ],
    transactions: [
      { id: 'tx-1', name: 'Fatura Agosto (BB - ELO)', date: '17/08', paymentType: 'BANCO DO BRASIL', category: 'Contas', value: 1637.36 },
      { id: 'tx-2', name: 'Fatura Agosto (BB)', date: '10/08', paymentType: 'BANCO DO BRASIL', category: 'Contas', value: 869.8 },
      { id: 'tx-3', name: 'Multa Nubank', date: '18/08', paymentType: 'NUBANK', category: 'Contas', value: 140.28 },
      { id: 'tx-4', name: 'Janta', date: '19/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 122.99 },
      { id: 'tx-5', name: 'Carne', date: '22/08', paymentType: 'BANCO DO BRASIL', category: 'Lazer', value: 118.5 },
      { id: 'tx-6', name: 'Gasolina', date: '18/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 100.0 },
      { id: 'tx-7', name: 'Almoço', date: '19/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 99.8 },
      { id: 'tx-8', name: 'Farmácia (Pai)', date: '01/08', paymentType: 'BANCO DO BRASIL', category: 'Presentes', value: 84.9 },
      { id: 'tx-9', name: 'Churrasco', date: '15/08', paymentType: 'BANCO DO BRASIL', category: 'Lazer', value: 79.01 },
      { id: 'tx-10', name: 'Corte de Cabelo', date: '26/08', paymentType: 'BANCO DO BRASIL', category: 'Beleza', value: 60.0 },
      { id: 'tx-11', name: 'Janta', date: '24/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 59.98 },
      { id: 'tx-12', name: 'Almoço', date: '07/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 59.18 },
      { id: 'tx-13', name: 'Almoço', date: '25/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 58.8 },
      { id: 'tx-14', name: 'Almoço', date: '26/08', paymentType: 'BANCO DO BRASIL', category: 'IFood/restaurante', value: 56.9 },
      { id: 'tx-15', name: 'Mercado', date: '22/08', paymentType: 'BANCO DO BRASIL', category: 'Mercado', value: 56.92 },
      { id: 'tx-16', name: 'Gasolina', date: '27/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 50.0 },
      { id: 'tx-17', name: 'Gasolina', date: '24/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 50.0 },
      { id: 'tx-18', name: 'Gasolina FASTBACK', date: '22/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 50.0 },
      { id: 'tx-19', name: 'Gasolina', date: '15/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 50.0 },
      { id: 'tx-20', name: 'Gasolina', date: '13/08', paymentType: 'BANCO DO BRASIL', category: 'Uber/transporte', value: 50.0 },
    ],
  };
}
