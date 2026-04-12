// =============================================================================
// Mock Data — Matches Monarch Money's real account data captured during analysis
// =============================================================================

export type AccountType = "cash" | "investments" | "creditCards" | "loans" | "property";

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  subtype: string;
  balance: number;
  lastSyncedAt: string;
  logoColor: string;
  monthChange: number;
  sparklineData: number[];
  creditLimit?: number;
}

export interface AccountGroup {
  id: string;
  type: AccountType;
  label: string;
  icon: string;
  accounts: Account[];
}

export interface Transaction {
  id: string;
  merchantName: string;
  originalStatement: string;
  amount: number;
  date: string;
  category: { name: string; emoji: string; group: string };
  accountName: string;
  accountId: string;
  isPending: boolean;
  isRecurring: boolean;
  isFlagged: boolean;
  notes: string;
}

export interface TransactionDateGroup {
  id: string;
  date: string;
  transactions: Transaction[];
}

export interface CashFlowMonth {
  id: string;
  month: string;
  income: number;
  expenses: number;
}

export interface CashFlowBreakdown {
  id: string;
  category: string;
  emoji: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  group: string;
  budgetAmount: number;
  actualAmount: number;
}

export interface BudgetSection {
  id: string;
  name: string;
  type: "income" | "fixed" | "flexible" | "nonMonthly";
  categories: BudgetCategory[];
}

export interface RecurringItem {
  id: string;
  merchantName: string;
  frequency: string;
  nextDate: string;
  accountName: string;
  category: { name: string; emoji: string };
  amount: number;
  isComplete: boolean;
}

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  price: number;
  quantity: number;
  value: number;
  weight: number;
  costBasis: number;
  performance3M: number | null;
}

export interface HoldingGroup {
  id: string;
  accountName: string;
  holdings: Holding[];
}

export interface Benchmark {
  id: string;
  name: string;
  performance3M: number;
  color: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  color: string;
  deadline: string;
  monthlyContribution: number;
  createdAt?: number;
}

export interface UserSettings {
  emailNotifs?: boolean;
  pushNotifs?: boolean;
  weeklyReport?: boolean;
  budgetAlerts?: boolean;
  largeTransactions?: boolean;
  darkMode?: boolean;
  accentColor?: string;
  displayName?: string;
  currency?: string;
}

export interface TransactionEdit {
  merchantName?: string;
  notes?: string;
  isFlagged?: boolean;
  isRecurring?: boolean;
  category?: string;
}

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

export const accountGroups: AccountGroup[] = [
  {
    id: "cash", type: "cash", label: "Cash", icon: "Banknote",
    accounts: [
      { id: "1", name: "360 Checking", institution: "Capital One", type: "cash", subtype: "Checking", balance: 7763.46, lastSyncedAt: "9 hours ago", logoColor: "#E03131", monthChange: 0, sparklineData: [7700,7720,7750,7760,7763] },
      { id: "2", name: "360 Performance Savings", institution: "Capital One", type: "cash", subtype: "Savings", balance: 7111.65, lastSyncedAt: "9 hours ago", logoColor: "#E03131", monthChange: 0, sparklineData: [7100,7105,7108,7110,7111] },
    ],
  },
  {
    id: "invest", type: "investments", label: "Investments", icon: "TrendingUp",
    accounts: [
      { id: "3", name: "Individual Brokerage", institution: "Charles Schwab", type: "investments", subtype: "Brokerage (Taxable)", balance: 7956.18, lastSyncedAt: "9 hours ago", logoColor: "#4D8FDB", monthChange: 0, sparklineData: [8000,7980,7950,7960,7956] },
      { id: "4", name: "Roth IRA", institution: "Charles Schwab", type: "investments", subtype: "Individual Retirement Account", balance: 15638.73, lastSyncedAt: "9 hours ago", logoColor: "#4D8FDB", monthChange: 0, sparklineData: [15700,15680,15650,15640,15638] },
      { id: "5", name: "401(k) Plan", institution: "Employer Plan", type: "investments", subtype: "401k", balance: 31524.37, lastSyncedAt: "2 hours ago", logoColor: "#2B8A3E", monthChange: 0, sparklineData: [31600,31580,31550,31530,31524] },
    ],
  },
  {
    id: "credit", type: "creditCards", label: "Credit Cards", icon: "CreditCard",
    accounts: [
      { id: "6", name: "Credit Card ...3856", institution: "Capital One", type: "creditCards", subtype: "Credit Card", balance: 5639.88, lastSyncedAt: "9 hours ago", logoColor: "#E5633A", monthChange: 0, sparklineData: [5200,5400,5500,5600,5639], creditLimit: 10000 },
      { id: "7", name: "Credit Card ...7540", institution: "Capital One", type: "creditCards", subtype: "Credit Card", balance: 8294.73, lastSyncedAt: "9 hours ago", logoColor: "#7C3AED", monthChange: 0, sparklineData: [7800,8000,8100,8200,8294], creditLimit: 15000 },
    ],
  },
];

export const transactionGroups: TransactionDateGroup[] = [
  {
    id: "apr11", date: "2026-04-11",
    transactions: [
      { id: "t1", merchantName: "Flo Health", originalStatement: "FLOHEALTH.COM", amount: 84.99, date: "2026-04-11", category: { name: "Medical", emoji: "💊", group: "Health" }, accountName: "Credit Card ...7540", accountId: "7", isPending: true, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
  {
    id: "apr10", date: "2026-04-10",
    transactions: [
      { id: "t2", merchantName: "DoorDash", originalStatement: "DOORDASH", amount: 29.94, date: "2026-04-10", category: { name: "Restaurants & Bars", emoji: "🍽", group: "Food & Dining" }, accountName: "Credit Card ...7540", accountId: "7", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
      { id: "t3", merchantName: "Ally Bank", originalStatement: "ALLY BANK", amount: 351.34, date: "2026-04-10", category: { name: "Auto Payment", emoji: "🚗", group: "Auto & Transport" }, accountName: "360 Checking", accountId: "1", isPending: false, isRecurring: true, isFlagged: false, notes: "" },
      { id: "t4", merchantName: "Tesla", originalStatement: "TESLA INC", amount: 99.00, date: "2026-04-10", category: { name: "Miscellaneous", emoji: "💲", group: "Other" }, accountName: "360 Checking", accountId: "1", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
  {
    id: "apr09", date: "2026-04-09",
    transactions: [
      { id: "t5", merchantName: "Ulta Beauty", originalStatement: "ULTA BEAUTY", amount: 50.00, date: "2026-04-09", category: { name: "Shopping", emoji: "🛍", group: "Shopping" }, accountName: "Credit Card ...7540", accountId: "7", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
      { id: "t6", merchantName: "Uber", originalStatement: "UBER TRIP", amount: 9.99, date: "2026-04-09", category: { name: "Taxi & Ride Shares", emoji: "🚕", group: "Auto & Transport" }, accountName: "360 Checking", accountId: "1", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
      { id: "t7", merchantName: "Starbucks", originalStatement: "STARBUCKS", amount: 10.00, date: "2026-04-09", category: { name: "Coffee Shops", emoji: "☕️", group: "Food & Dining" }, accountName: "Credit Card ...7540", accountId: "7", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
];

export const cashFlowMonths: CashFlowMonth[] = [
  { id: "dec", month: "Dec", income: 2100, expenses: 5800 },
  { id: "jan", month: "Jan", income: 14500, expenses: 7200 },
  { id: "feb", month: "Feb", income: 7800, expenses: 6500 },
  { id: "mar", month: "Mar", income: 8200, expenses: 7600 },
  { id: "apr", month: "Apr", income: 2182, expenses: 5580 },
];

export const expenseBreakdown: CashFlowBreakdown[] = [
  { id: "mort", category: "Mortgage", emoji: "🏠", amount: 3566.16, percentage: 63.9, color: "#E03131" },
  { id: "rest", category: "Restaurants & Bars", emoji: "🍽", amount: 695.48, percentage: 12.5, color: "#E5633A" },
  { id: "shop", category: "Shopping", emoji: "🛍", amount: 352.07, percentage: 6.3, color: "#7C3AED" },
  { id: "auto", category: "Auto Payment", emoji: "🚗", amount: 351.34, percentage: 6.3, color: "#4D8FDB" },
  { id: "groc", category: "Groceries", emoji: "🍏", amount: 161.39, percentage: 2.9, color: "#2B8A3E" },
  { id: "med",  category: "Medical", emoji: "💊", amount: 107.03, percentage: 1.9, color: "#0891B2" },
];

export const incomeBreakdown: CashFlowBreakdown[] = [
  { id: "pay",   category: "Paychecks", emoji: "💵", amount: 1750.47, percentage: 80.2, color: "#2B8A3E" },
  { id: "other", category: "Other Income", emoji: "💰", amount: 431.77, percentage: 19.8, color: "#5C9E6B" },
];

export const budgetSections: BudgetSection[] = [
  { id: "income", name: "Income", type: "income", categories: [
    { id: "b1", name: "Paychecks", emoji: "💵", group: "Income", budgetAmount: 9200, actualAmount: 1750 },
    { id: "b2", name: "Other Income", emoji: "💰", group: "Income", budgetAmount: 9920, actualAmount: 432 },
  ]},
  { id: "fixed", name: "Fixed", type: "fixed", categories: [
    { id: "b3", name: "Auto Payment", emoji: "🚗", group: "Auto & Transport", budgetAmount: 350, actualAmount: 351 },
    { id: "b4", name: "Mortgage", emoji: "🏠", group: "Housing", budgetAmount: 3550, actualAmount: 3566 },
    { id: "b5", name: "Gas & Electric", emoji: "⚡️", group: "Bills", budgetAmount: 120, actualAmount: 0 },
    { id: "b6", name: "Internet & Cable", emoji: "🌐", group: "Bills", budgetAmount: 70, actualAmount: 0 },
    { id: "b7", name: "Fitness", emoji: "💪", group: "Health", budgetAmount: 60, actualAmount: 0 },
  ]},
  { id: "flex", name: "Flexible", type: "flexible", categories: [
    { id: "b8", name: "Restaurants & Bars", emoji: "🍽", group: "Food & Dining", budgetAmount: 0, actualAmount: 695 },
    { id: "b9", name: "Shopping", emoji: "🛍", group: "Shopping", budgetAmount: 0, actualAmount: 352 },
    { id: "b10", name: "Groceries", emoji: "🍏", group: "Food & Dining", budgetAmount: 0, actualAmount: 161 },
    { id: "b11", name: "Coffee Shops", emoji: "☕️", group: "Food & Dining", budgetAmount: 0, actualAmount: 20 },
  ]},
  { id: "nonmo", name: "Non-Monthly", type: "nonMonthly", categories: [
    { id: "b12", name: "Travel & Vacation", emoji: "🏝", group: "Travel", budgetAmount: 900, actualAmount: 0 },
    { id: "b13", name: "Medical", emoji: "💊", group: "Health", budgetAmount: 130, actualAmount: 107 },
  ]},
];

export const recurringItems: RecurringItem[] = [
  { id: "r1", merchantName: "San Diego Gas & Electric", frequency: "Every month", nextDate: "Apr 23", accountName: "360 Checking", category: { name: "Gas & Electric", emoji: "⚡️" }, amount: 116.58, isComplete: false },
  { id: "r2", merchantName: "Cox Communications", frequency: "Every month", nextDate: "Apr 24", accountName: "360 Checking", category: { name: "Internet & Cable", emoji: "🌐" }, amount: 70.00, isComplete: false },
  { id: "r3", merchantName: "Paramount+", frequency: "Every month", nextDate: "Apr 26", accountName: "Credit Card ...7540", category: { name: "Entertainment", emoji: "🎥" }, amount: 13.99, isComplete: false },
  { id: "r4", merchantName: "Bilt Rewards", frequency: "Every month", nextDate: "Apr 2", accountName: "360 Checking", category: { name: "Mortgage", emoji: "🏠" }, amount: 3566.16, isComplete: true },
  { id: "r5", merchantName: "Ally Bank", frequency: "Every month", nextDate: "Apr 10", accountName: "360 Checking", category: { name: "Auto Payment", emoji: "🚗" }, amount: 351.34, isComplete: true },
];

export const holdingGroups: HoldingGroup[] = [
  { id: "h1", accountName: "Individual Brokerage", holdings: [
    { id: "h1a", ticker: "SWPPX", name: "Schwab S&P 500 Index", price: 17.52, quantity: 340.53, value: 5966.02, weight: 9.52, costBasis: 3739.62, performance3M: -2.01 },
    { id: "h1b", ticker: "NVDA", name: "NVIDIA Corporation", price: 188.75, quantity: 3.0, value: 566.25, weight: 0.90, costBasis: 203.02, performance3M: 2.00 },
    { id: "h1c", ticker: "AAPL", name: "Apple Inc.", price: 260.48, quantity: 1, value: 260.48, weight: 0.42, costBasis: 129.47, performance3M: 0.09 },
  ]},
  { id: "h2", accountName: "Roth IRA", holdings: [
    { id: "h2a", ticker: "SWTSX", name: "Schwab Total Stock Market", price: 16.42, quantity: 357.51, value: 5870.28, weight: 9.36, costBasis: 3846.44, performance3M: -2.03 },
    { id: "h2b", ticker: "XAR", name: "SPDR S&P Aerospace & Defense", price: 267.81, quantity: 2.07, value: 553.88, weight: 0.88, costBasis: 191.34, performance3M: 4.66 },
    { id: "h2c", ticker: "NVDA", name: "NVIDIA Corporation", price: 188.75, quantity: 10.02, value: 1891.30, weight: 3.02, costBasis: 678.10, performance3M: 2.00 },
  ]},
  { id: "h3", accountName: "401(k) Plan", holdings: [
    { id: "h3a", ticker: "SP500", name: "S&P 500 Index Fund Cl C", price: 324.95, quantity: 47.25, value: 15355.19, weight: 24.49, costBasis: 14000, performance3M: null },
    { id: "h3b", ticker: "TGT2060", name: "Target Retirement 2060", price: 23.63, quantity: 684.27, value: 16169.18, weight: 25.79, costBasis: 15000, performance3M: null },
  ]},
];

export const benchmarks: Benchmark[] = [
  { id: "port", name: "Your Portfolio", performance3M: -7.04, color: "#E5633A" },
  { id: "sp", name: "S&P 500", performance3M: -2.28, color: "#4D8FDB" },
  { id: "us", name: "US Stocks", performance3M: -2.33, color: "#2B8A3E" },
  { id: "bonds", name: "US Bonds", performance3M: -0.79, color: "#E03131" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

export function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getNetWorth(): number {
  return accountGroups.reduce((sum, g) => {
    const groupTotal = g.accounts.reduce((s, a) => s + a.balance, 0);
    return g.type === "creditCards" || g.type === "loans" ? sum - groupTotal : sum + groupTotal;
  }, 0);
}

export function getAssetsTotal(): number {
  return accountGroups
    .filter(g => g.type !== "creditCards" && g.type !== "loans")
    .reduce((sum, g) => sum + g.accounts.reduce((s, a) => s + a.balance, 0), 0);
}

export function getLiabilitiesTotal(): number {
  return accountGroups
    .filter(g => g.type === "creditCards" || g.type === "loans")
    .reduce((sum, g) => sum + g.accounts.reduce((s, a) => s + a.balance, 0), 0);
}

export const monthlyData = [
  { month: 'Nov', income: 6800, expenses: 5200 },
  { month: 'Dec', income: 7200, expenses: 6100 },
  { month: 'Jan', income: 6500, expenses: 5400 },
  { month: 'Feb', income: 7100, expenses: 5800 },
  { month: 'Mar', income: 7300, expenses: 5500 },
  { month: 'Apr', income: 6869.91, expenses: 5006.95 },
];

export const reportData = {
  transactions: [
    { merchant: 'Whole Foods', category: 'Groceries', amount: -127.43 },
    { merchant: 'Shell Gas', category: 'Transportation', amount: -58.20 },
    { merchant: 'Amazon', category: 'Shopping', amount: -234.99 },
    { merchant: 'Netflix', category: 'Entertainment', amount: -15.99 },
    { merchant: 'Starbucks', category: 'Dining', amount: -6.45 },
    { merchant: 'Target', category: 'Shopping', amount: -89.50 },
    { merchant: 'Employer', category: 'Income', amount: 4500.00 },
    { merchant: 'Freelance Client', category: 'Income', amount: 1200.00 },
    { merchant: 'Electric Company', category: 'Utilities', amount: -142.30 },
    { merchant: 'Gym Membership', category: 'Health', amount: -49.99 },
  ],
};

export const recurringData = {
  income: [
    { merchant: 'Employer Direct Deposit', amount: 4500, frequency: 'Bi-weekly', status: 'paid', nextDate: 'Apr 18', daysUntil: 7, emoji: '💼', category: 'Salary', dueDate: '1st & 15th' },
    { merchant: 'Freelance Client', amount: 1200, frequency: 'Monthly', status: 'upcoming', nextDate: 'Apr 30', daysUntil: 19, emoji: '💻', category: 'Freelance', dueDate: '30th' },
  ],
  expenses: [
    { merchant: 'Rent Payment', amount: 1800, dueDate: '1st', category: 'Housing', status: 'paid', nextDate: 'May 1', daysUntil: 20, emoji: '🏠', frequency: 'Monthly' },
    { merchant: 'Car Insurance', amount: 145, dueDate: '5th', category: 'Insurance', status: 'paid', nextDate: 'May 5', daysUntil: 24, emoji: '🚗', frequency: 'Monthly' },
    { merchant: 'Netflix', amount: 15.99, dueDate: '10th', category: 'Entertainment', status: 'paid', nextDate: 'May 10', daysUntil: 29, emoji: '🎬', frequency: 'Monthly' },
    { merchant: 'Spotify', amount: 9.99, dueDate: '12th', category: 'Entertainment', status: 'paid', nextDate: 'May 12', daysUntil: 31, emoji: '🎵', frequency: 'Monthly' },
    { merchant: 'Gym Membership', amount: 49.99, dueDate: '15th', category: 'Health', status: 'upcoming', nextDate: 'Apr 15', daysUntil: 4, emoji: '🏋️', frequency: 'Monthly' },
    { merchant: 'Internet Provider', amount: 79.99, dueDate: '18th', category: 'Utilities', status: 'upcoming', nextDate: 'Apr 18', daysUntil: 7, emoji: '🌐', frequency: 'Monthly' },
    { merchant: 'Phone Bill', amount: 85, dueDate: '20th', category: 'Utilities', status: 'upcoming', nextDate: 'Apr 20', daysUntil: 9, emoji: '📱', frequency: 'Monthly' },
    { merchant: 'Student Loan', amount: 350, dueDate: '25th', category: 'Loans', status: 'upcoming', nextDate: 'Apr 25', daysUntil: 14, emoji: '🎓', frequency: 'Monthly' },
  ],
  creditCards: [
    { merchant: 'Chase Sapphire', amount: 1250, dueDate: '15th', category: 'Credit Card', status: 'upcoming', nextDate: 'Apr 15', daysUntil: 4, emoji: '💳', frequency: 'Monthly' },
    { merchant: 'Amex Gold', amount: 680, dueDate: '22nd', category: 'Credit Card', status: 'upcoming', nextDate: 'Apr 22', daysUntil: 11, emoji: '💳', frequency: 'Monthly' },
  ],
};

export function generateNetWorthTimeline(): { date: string; value: number }[] {
  const points = [];
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 30 + i);
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 62000 + i * 60 + (Math.random() - 0.5) * 1000,
    });
  }
  return points;
}
