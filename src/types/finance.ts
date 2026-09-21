export interface Transaction {
  id: string;
  name: string;
  date?: string;
  paymentType: string;
  category: string;
  value: number;
  isFixed?: boolean;
  installments?: string;
  isPaid?: boolean;
}

export interface CategorySummary {
  name: string;
  expected: number;
  spent: number;
  percentage: number;
  isAlert: boolean;
}

export interface PaymentTypeSummary {
  name: string;
  spent: number;
  isPaid?: boolean;
}

export interface MonthSummary {
  monthName: string;
  gid: string;
  incomeTotal: number;
  totalSpent: number;
  fixedSpent: number;
  monthSpent: number;
  cardInstallmentsSpent: number;
  remainingBalance: number;
  categories: CategorySummary[];
  paymentMethods: PaymentTypeSummary[];
  transactions: Transaction[];
  fixedExpenses: Transaction[];
  installments: Transaction[];
  lastUpdated?: string;
}

export interface MonthOption {
  name: string;
  gid: string;
}

export const KNOWN_MONTHS: MonthOption[] = [
  { name: 'Janeiro', gid: '501738112' },
  { name: 'Fevereiro', gid: '1364732674' },
  { name: 'Março', gid: '585751528' },
  { name: 'Abril', gid: '2008485540' },
  { name: 'Maio', gid: '2024519987' },
  { name: 'Junho', gid: '1952700957' },
  { name: 'Julho', gid: '736553474' },
  { name: 'Agosto', gid: '1690471053' },
  { name: 'Setembro', gid: '1061648851' },
  { name: 'Outubro', gid: '879729485' },
];

export const SPREADSHEET_BASE_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTKiwxfLGGgfjaveTtW0ES34dlbYXUIq7MQSJhzBZ1kJWk9KCiwSvqkwW-riUHCjKFW17Ac3iv2ag8l';

export const SPREADSHEET_WEB_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTKiwxfLGGgfjaveTtW0ES34dlbYXUIq7MQSJhzBZ1kJWk9KCiwSvqkwW-riUHCjKFW17Ac3iv2ag8l/pubhtml';
