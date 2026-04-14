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
  excludedRecurring?: string[]; // merchant names the user has marked as not recurring
  hiddenAccounts?: string[]; // account_ids to exclude from totals/charts
  categoryOverrides?: Record<string, string>; // plaidCategoryName -> renamedCategory
  manualTransferIds?: string[]; // transaction_ids user manually marked as transfers
  nonTransferIds?: string[]; // transaction_ids user manually un-marked as transfers
}

export interface CategorizationRule {
  id: string;
  merchantPattern: string; // substring or regex-like pattern
  setCategory?: string;
  setFlag?: boolean;
  setRecurring?: boolean;
  setNotes?: string;
  createdAt?: number;
}

export interface TransactionSplit {
  id: string; // = transaction_id
  splits: { category: string; amount: number; notes?: string }[];
}

export interface TransactionEdit {
  merchantName?: string;
  notes?: string;
  isFlagged?: boolean;
  isRecurring?: boolean;
  category?: string;
  tags?: string[];
}

export interface ManualAccount {
  id: string;
  name: string;
  institution?: string;
  type: "cash" | "investments" | "creditCards" | "loans" | "property" | "crypto" | "other";
  subtype: string;
  balance: number;
  notes?: string;
  createdAt?: number;
  lastUpdated?: number;
}

export interface BudgetTargetConfig {
  amount: number;
  rollover?: boolean; // if true, unused budget from prior month carries over
  rolledOverBalance?: number; // computed balance carried from previous months
}

// Metadata for user-created budget categories
export interface BudgetCategoryMeta {
  id: string; // = category slug
  name: string;
  emoji: string;
  section: "income" | "fixed" | "flexible" | "nonMonthly";
}

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

// All mock data below is fictional — used only for unauthenticated visitors
// browsing the app in demo mode. Real user data is isolated per-household.

export const accountGroups: AccountGroup[] = [
  {
    id: "cash", type: "cash", label: "Cash", icon: "Banknote",
    accounts: [
      { id: "demo-1", name: "Everyday Checking", institution: "Demo Bank", type: "cash", subtype: "Checking", balance: 4820.15, lastSyncedAt: "Demo", logoColor: "#4D8FDB", monthChange: 0, sparklineData: [4750,4780,4800,4810,4820] },
      { id: "demo-2", name: "High-Yield Savings", institution: "Demo Bank", type: "cash", subtype: "Savings", balance: 12500.00, lastSyncedAt: "Demo", logoColor: "#4D8FDB", monthChange: 0, sparklineData: [11800,12000,12200,12400,12500] },
    ],
  },
  {
    id: "invest", type: "investments", label: "Investments", icon: "TrendingUp",
    accounts: [
      { id: "demo-3", name: "Sample Brokerage", institution: "Sample Broker", type: "investments", subtype: "Brokerage", balance: 18250.42, lastSyncedAt: "Demo", logoColor: "#2B8A3E", monthChange: 0, sparklineData: [17800,17900,18000,18100,18250] },
      { id: "demo-4", name: "Roth IRA", institution: "Sample Broker", type: "investments", subtype: "Retirement", balance: 22100.80, lastSyncedAt: "Demo", logoColor: "#2B8A3E", monthChange: 0, sparklineData: [21500,21700,21900,22000,22100] },
    ],
  },
  {
    id: "credit", type: "creditCards", label: "Credit Cards", icon: "CreditCard",
    accounts: [
      { id: "demo-5", name: "Rewards Card", institution: "Demo Bank", type: "creditCards", subtype: "Credit Card", balance: 1425.30, lastSyncedAt: "Demo", logoColor: "#E5633A", monthChange: 0, sparklineData: [1200,1300,1350,1400,1425], creditLimit: 10000 },
    ],
  },
];

export const transactionGroups: TransactionDateGroup[] = [
  {
    id: "demo-d1", date: "2026-04-12",
    transactions: [
      { id: "demo-t1", merchantName: "Grocery Store", originalStatement: "GROCERY STORE #123", amount: 87.40, date: "2026-04-12", category: { name: "Groceries", emoji: "🛒", group: "Food & Dining" }, accountName: "Rewards Card", accountId: "demo-5", isPending: true, isRecurring: false, isFlagged: false, notes: "" },
      { id: "demo-t2", merchantName: "Coffee Shop", originalStatement: "COFFEE SHOP", amount: 5.75, date: "2026-04-12", category: { name: "Coffee Shops", emoji: "☕️", group: "Food & Dining" }, accountName: "Rewards Card", accountId: "demo-5", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
  {
    id: "demo-d2", date: "2026-04-11",
    transactions: [
      { id: "demo-t3", merchantName: "Streaming Service", originalStatement: "STREAMING*SUB", amount: 15.99, date: "2026-04-11", category: { name: "Entertainment", emoji: "🎬", group: "Entertainment" }, accountName: "Rewards Card", accountId: "demo-5", isPending: false, isRecurring: true, isFlagged: false, notes: "" },
      { id: "demo-t4", merchantName: "Gas Station", originalStatement: "GAS STATION", amount: 42.18, date: "2026-04-11", category: { name: "Gas", emoji: "⛽", group: "Auto & Transport" }, accountName: "Everyday Checking", accountId: "demo-1", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
      { id: "demo-t5", merchantName: "Ride Share", originalStatement: "RIDESHARE TRIP", amount: 12.50, date: "2026-04-11", category: { name: "Taxi & Ride Shares", emoji: "🚕", group: "Auto & Transport" }, accountName: "Rewards Card", accountId: "demo-5", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
  {
    id: "demo-d3", date: "2026-04-10",
    transactions: [
      { id: "demo-t6", merchantName: "Employer Payroll", originalStatement: "PAYROLL DEPOSIT", amount: -3200.00, date: "2026-04-10", category: { name: "Paychecks", emoji: "💵", group: "Income" }, accountName: "Everyday Checking", accountId: "demo-1", isPending: false, isRecurring: true, isFlagged: false, notes: "" },
      { id: "demo-t7", merchantName: "Online Retailer", originalStatement: "ONLINE RETAILER", amount: 48.20, date: "2026-04-10", category: { name: "Shopping", emoji: "🛍", group: "Shopping" }, accountName: "Rewards Card", accountId: "demo-5", isPending: false, isRecurring: false, isFlagged: false, notes: "" },
    ],
  },
  {
    id: "demo-d4", date: "2026-04-08",
    transactions: [
      { id: "demo-t8", merchantName: "Rent Payment", originalStatement: "RENT PAYMENT", amount: 1850.00, date: "2026-04-08", category: { name: "Rent", emoji: "🏠", group: "Housing" }, accountName: "Everyday Checking", accountId: "demo-1", isPending: false, isRecurring: true, isFlagged: false, notes: "" },
      { id: "demo-t9", merchantName: "Gym Membership", originalStatement: "FITNESS CLUB", amount: 39.99, date: "2026-04-08", category: { name: "Fitness", emoji: "💪", group: "Health" }, accountName: "Rewards Card", accountId: "demo-5", isPending: false, isRecurring: true, isFlagged: false, notes: "" },
    ],
  },
];

export const cashFlowMonths: CashFlowMonth[] = [
  { id: "nov", month: "Nov", income: 6400, expenses: 4500 },
  { id: "dec", month: "Dec", income: 6400, expenses: 5200 },
  { id: "jan", month: "Jan", income: 6800, expenses: 4100 },
  { id: "feb", month: "Feb", income: 6400, expenses: 3900 },
  { id: "mar", month: "Mar", income: 6400, expenses: 4300 },
  { id: "apr", month: "Apr", income: 6800, expenses: 3810 },
];

export const expenseBreakdown: CashFlowBreakdown[] = [
  { id: "rent", category: "Rent", emoji: "🏠", amount: 1850.00, percentage: 48.5, color: "#E03131" },
  { id: "groc", category: "Groceries", emoji: "🛒", amount: 520.40, percentage: 13.6, color: "#2B8A3E" },
  { id: "dine", category: "Restaurants & Bars", emoji: "🍽", amount: 385.20, percentage: 10.1, color: "#E5633A" },
  { id: "shop", category: "Shopping", emoji: "🛍", amount: 318.75, percentage: 8.4, color: "#7C3AED" },
  { id: "auto", category: "Gas & Transport", emoji: "⛽", amount: 245.80, percentage: 6.4, color: "#4D8FDB" },
  { id: "sub",  category: "Subscriptions", emoji: "🎬", amount: 89.97, percentage: 2.4, color: "#0891B2" },
];

export const incomeBreakdown: CashFlowBreakdown[] = [
  { id: "pay",   category: "Paychecks", emoji: "💵", amount: 6400.00, percentage: 94.1, color: "#2B8A3E" },
  { id: "other", category: "Other Income", emoji: "💰", amount: 400.00, percentage: 5.9, color: "#5C9E6B" },
];

export const budgetSections: BudgetSection[] = [
  { id: "income", name: "Income", type: "income", categories: [
    { id: "b1", name: "Paychecks", emoji: "💵", group: "Income", budgetAmount: 6400, actualAmount: 6400 },
  ]},
  { id: "fixed", name: "Fixed", type: "fixed", categories: [
    { id: "b3", name: "Rent", emoji: "🏠", group: "Housing", budgetAmount: 1850, actualAmount: 1850 },
    { id: "b5", name: "Utilities", emoji: "⚡️", group: "Bills", budgetAmount: 180, actualAmount: 165 },
    { id: "b6", name: "Internet", emoji: "🌐", group: "Bills", budgetAmount: 75, actualAmount: 75 },
    { id: "b7", name: "Gym Membership", emoji: "💪", group: "Health", budgetAmount: 40, actualAmount: 39.99 },
  ]},
  { id: "flex", name: "Flexible", type: "flexible", categories: [
    { id: "b8", name: "Groceries", emoji: "🛒", group: "Food & Dining", budgetAmount: 600, actualAmount: 520.40 },
    { id: "b9", name: "Restaurants", emoji: "🍽", group: "Food & Dining", budgetAmount: 300, actualAmount: 385.20 },
    { id: "b10", name: "Shopping", emoji: "🛍", group: "Shopping", budgetAmount: 250, actualAmount: 318.75 },
    { id: "b11", name: "Coffee", emoji: "☕️", group: "Food & Dining", budgetAmount: 50, actualAmount: 34.25 },
  ]},
  { id: "nonmo", name: "Non-Monthly", type: "nonMonthly", categories: [
    { id: "b12", name: "Travel", emoji: "🏝", group: "Travel", budgetAmount: 200, actualAmount: 0 },
  ]},
];

export const recurringItems: RecurringItem[] = [
  { id: "r1", merchantName: "Electric Company", frequency: "Every month", nextDate: "Apr 20", accountName: "Everyday Checking", category: { name: "Utilities", emoji: "⚡️" }, amount: 95.50, isComplete: false },
  { id: "r2", merchantName: "Internet Provider", frequency: "Every month", nextDate: "Apr 22", accountName: "Everyday Checking", category: { name: "Utilities", emoji: "🌐" }, amount: 75.00, isComplete: false },
  { id: "r3", merchantName: "Streaming Service", frequency: "Every month", nextDate: "Apr 25", accountName: "Rewards Card", category: { name: "Entertainment", emoji: "🎬" }, amount: 15.99, isComplete: false },
  { id: "r4", merchantName: "Rent Payment", frequency: "Every month", nextDate: "May 1", accountName: "Everyday Checking", category: { name: "Housing", emoji: "🏠" }, amount: 1850.00, isComplete: true },
  { id: "r5", merchantName: "Gym Membership", frequency: "Every month", nextDate: "Apr 15", accountName: "Rewards Card", category: { name: "Fitness", emoji: "💪" }, amount: 39.99, isComplete: true },
];

export const holdingGroups: HoldingGroup[] = [
  { id: "demo-h1", accountName: "Sample Brokerage", holdings: [
    { id: "demo-h1a", ticker: "VTI", name: "Total US Stock Market ETF", price: 245.30, quantity: 42.0, value: 10302.60, weight: 56.5, costBasis: 9200.00, performance3M: 2.8 },
    { id: "demo-h1b", ticker: "VXUS", name: "Total International Stock ETF", price: 58.12, quantity: 85.0, value: 4940.20, weight: 27.1, costBasis: 4700.00, performance3M: 1.2 },
    { id: "demo-h1c", ticker: "BND", name: "Total Bond Market ETF", price: 72.85, quantity: 40.75, value: 2968.62, weight: 16.3, costBasis: 3000.00, performance3M: -0.5 },
  ]},
  { id: "demo-h2", accountName: "Roth IRA", holdings: [
    { id: "demo-h2a", ticker: "VTI", name: "Total US Stock Market ETF", price: 245.30, quantity: 65.0, value: 15944.50, weight: 72.1, costBasis: 14500.00, performance3M: 2.8 },
    { id: "demo-h2b", ticker: "VXUS", name: "Total International Stock ETF", price: 58.12, quantity: 106.0, value: 6160.72, weight: 27.9, costBasis: 5900.00, performance3M: 1.2 },
  ]},
];

export const benchmarks: Benchmark[] = [
  { id: "port", name: "Your Portfolio", performance3M: 2.6, color: "#E5633A" },
  { id: "sp", name: "S&P 500", performance3M: 2.8, color: "#4D8FDB" },
  { id: "us", name: "US Stocks", performance3M: 2.5, color: "#2B8A3E" },
  { id: "bonds", name: "US Bonds", performance3M: -0.5, color: "#E03131" },
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
  { month: 'Nov', income: 6400, expenses: 4500 },
  { month: 'Dec', income: 6400, expenses: 5200 },
  { month: 'Jan', income: 6800, expenses: 4100 },
  { month: 'Feb', income: 6400, expenses: 3900 },
  { month: 'Mar', income: 6400, expenses: 4300 },
  { month: 'Apr', income: 6800, expenses: 3810 },
];

export const reportData = {
  transactions: [
    { merchant: 'Grocery Store', category: 'Groceries', amount: -87.40 },
    { merchant: 'Gas Station', category: 'Transportation', amount: -42.18 },
    { merchant: 'Online Retailer', category: 'Shopping', amount: -48.20 },
    { merchant: 'Streaming Service', category: 'Entertainment', amount: -15.99 },
    { merchant: 'Coffee Shop', category: 'Dining', amount: -5.75 },
    { merchant: 'Employer Payroll', category: 'Income', amount: 3200.00 },
    { merchant: 'Rent Payment', category: 'Housing', amount: -1850.00 },
    { merchant: 'Gym Membership', category: 'Health', amount: -39.99 },
    { merchant: 'Ride Share', category: 'Transportation', amount: -12.50 },
  ],
};

export const recurringData = {
  income: [
    { merchant: 'Employer Payroll', amount: 3200, frequency: 'Bi-weekly', status: 'paid', nextDate: 'Apr 24', daysUntil: 11, emoji: '💼', category: 'Income', dueDate: '10th & 24th' },
  ],
  expenses: [
    { merchant: 'Rent Payment', amount: 1850, dueDate: '1st', category: 'Housing', status: 'paid', nextDate: 'May 1', daysUntil: 18, emoji: '🏠', frequency: 'Monthly' },
    { merchant: 'Streaming Service', amount: 15.99, dueDate: '11th', category: 'Entertainment', status: 'paid', nextDate: 'May 11', daysUntil: 28, emoji: '🎬', frequency: 'Monthly' },
    { merchant: 'Gym Membership', amount: 39.99, dueDate: '8th', category: 'Health', status: 'paid', nextDate: 'May 8', daysUntil: 25, emoji: '💪', frequency: 'Monthly' },
    { merchant: 'Internet Provider', amount: 75.00, dueDate: '22nd', category: 'Utilities', status: 'upcoming', nextDate: 'Apr 22', daysUntil: 9, emoji: '🌐', frequency: 'Monthly' },
    { merchant: 'Electric Company', amount: 95.50, dueDate: '20th', category: 'Utilities', status: 'upcoming', nextDate: 'Apr 20', daysUntil: 7, emoji: '⚡', frequency: 'Monthly' },
  ],
  creditCards: [
    { merchant: 'Rewards Card Payment', amount: 520, dueDate: '18th', category: 'Credit Card', status: 'upcoming', nextDate: 'Apr 18', daysUntil: 5, emoji: '💳', frequency: 'Monthly' },
  ],
};

export function generateNetWorthTimeline(): { date: string; value: number }[] {
  // Generic upward trend for demo mode — not based on any real account
  const points = [];
  const start = 55000;
  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 30 + i);
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: start + i * 75 + (Math.random() - 0.5) * 800,
    });
  }
  return points;
}
