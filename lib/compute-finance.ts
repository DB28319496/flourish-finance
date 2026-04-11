/**
 * Pure computation functions that derive financial data from raw Plaid transactions.
 * All functions return types matching mock-data.ts interfaces so UI components
 * need zero structural changes — only data source swaps.
 *
 * Plaid convention: positive amount = debit (money out), negative = credit (money in)
 */

import type { PlaidAccount, PlaidTransaction } from "./plaid-service";
import type {
  CashFlowMonth,
  CashFlowBreakdown,
  BudgetCategory,
  BudgetSection,
  Transaction,
} from "./mock-data";

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = [
  "#E03131", "#E5633A", "#7C3AED", "#4D8FDB", "#2B8A3E",
  "#0891B2", "#D97706", "#BE185D", "#6D28D9", "#059669",
  "#DC2626", "#9333EA", "#2563EB", "#16A34A", "#CA8A04",
];

const CATEGORY_EMOJI: Record<string, string> = {
  "Food and Drink": "🍽", "Restaurants": "🍽", "Coffee Shop": "☕️",
  "Groceries": "🛒", "Shopping": "🛍", "Travel": "✈️",
  "Transportation": "🚗", "Transfer": "↔️", "Payment": "💳",
  "Recreation": "🎬", "Healthcare": "💊", "Service": "🔧",
  "Rent": "🏠", "Mortgage": "🏠", "Utilities": "💡", "Insurance": "🛡",
  "Entertainment": "🎬", "Education": "📚", "Personal Care": "💇",
  "Payroll": "💵", "Income": "💰", "Deposit": "💰",
};

function getEmoji(category: string): string {
  return CATEGORY_EMOJI[category] || "💰";
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1);
  return d.toLocaleDateString("en-US", { month: "short" });
}

// ---------------------------------------------------------------------------
// Cash Flow
// ---------------------------------------------------------------------------

export function computeCashFlowMonths(
  transactions: PlaidTransaction[],
  numMonths = 6
): CashFlowMonth[] {
  const monthly: Record<string, { income: number; expenses: number }> = {};

  for (const tx of transactions) {
    const key = getMonthKey(tx.date);
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
    if (tx.amount < 0) {
      monthly[key].income += Math.abs(tx.amount);
    } else {
      monthly[key].expenses += tx.amount;
    }
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-numMonths)
    .map(([key, data]) => ({
      id: key,
      month: getMonthLabel(key),
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    }));
}

// ---------------------------------------------------------------------------
// Expense / Income Breakdown
// ---------------------------------------------------------------------------

export function computeExpenseBreakdown(
  transactions: PlaidTransaction[],
  monthKey?: string
): CashFlowBreakdown[] {
  const targetMonth = monthKey || getCurrentMonthKey();
  const expenses = transactions.filter(
    (tx) => tx.amount > 0 && getMonthKey(tx.date) === targetMonth
  );

  const byCategory: Record<string, number> = {};
  for (const tx of expenses) {
    const cat = tx.category?.[0] || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + tx.amount;
  }

  const total = Object.values(byCategory).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount], idx) => ({
      id: category.toLowerCase().replace(/\s+/g, "-"),
      category,
      emoji: getEmoji(category),
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / total) * 1000) / 10,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
}

export function computeIncomeBreakdown(
  transactions: PlaidTransaction[],
  monthKey?: string
): CashFlowBreakdown[] {
  const targetMonth = monthKey || getCurrentMonthKey();
  const income = transactions.filter(
    (tx) => tx.amount < 0 && getMonthKey(tx.date) === targetMonth
  );

  const bySource: Record<string, number> = {};
  for (const tx of income) {
    const source = tx.merchant_name || tx.name || "Other";
    bySource[source] = (bySource[source] || 0) + Math.abs(tx.amount);
  }

  const total = Object.values(bySource).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(bySource)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount], idx) => ({
      id: category.toLowerCase().replace(/\s+/g, "-"),
      category,
      emoji: getEmoji(category),
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / total) * 1000) / 10,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Monthly Totals (for charts)
// ---------------------------------------------------------------------------

export function computeMonthlyTotals(
  transactions: PlaidTransaction[],
  numMonths = 6
): { month: string; income: number; expenses: number }[] {
  const monthly: Record<string, { income: number; expenses: number }> = {};

  for (const tx of transactions) {
    const key = getMonthKey(tx.date);
    if (!monthly[key]) monthly[key] = { income: 0, expenses: 0 };
    if (tx.amount < 0) {
      monthly[key].income += Math.abs(tx.amount);
    } else {
      monthly[key].expenses += tx.amount;
    }
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-numMonths)
    .map(([key, data]) => ({
      month: getMonthLabel(key),
      income: Math.round(data.income * 100) / 100,
      expenses: Math.round(data.expenses * 100) / 100,
    }));
}

// ---------------------------------------------------------------------------
// Transaction Stats (for reports sidebar)
// ---------------------------------------------------------------------------

export interface TransactionStats {
  totalCount: number;
  largest: number;
  average: number;
  totalIncome: number;
  totalSpending: number;
}

export function computeTransactionStats(transactions: PlaidTransaction[]): TransactionStats {
  if (transactions.length === 0) {
    return { totalCount: 0, largest: 0, average: 0, totalIncome: 0, totalSpending: 0 };
  }

  let largest = 0;
  let totalIncome = 0;
  let totalSpending = 0;

  for (const tx of transactions) {
    const abs = Math.abs(tx.amount);
    if (abs > largest) largest = abs;
    if (tx.amount < 0) totalIncome += Math.abs(tx.amount);
    else totalSpending += tx.amount;
  }

  return {
    totalCount: transactions.length,
    largest: Math.round(largest * 100) / 100,
    average: Math.round((totalSpending / transactions.filter((t) => t.amount > 0).length || 1) * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalSpending: Math.round(totalSpending * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Flat transactions (for reports transaction list)
// ---------------------------------------------------------------------------

export function flattenTransactions(
  transactions: PlaidTransaction[]
): { merchant: string; category: string; amount: number }[] {
  return transactions
    .slice(0, 50)
    .map((tx) => ({
      merchant: tx.merchant_name || tx.name,
      category: tx.category?.[1] || tx.category?.[0] || "Other",
      amount: tx.amount > 0 ? -tx.amount : Math.abs(tx.amount),
    }));
}

// ---------------------------------------------------------------------------
// Recurring Detection
// ---------------------------------------------------------------------------

export interface ComputedRecurringItem {
  merchant: string;
  amount: number;
  frequency: string;
  status: "paid" | "upcoming";
  nextDate: string;
  daysUntil: number;
  emoji: string;
  category: string;
  dueDate: string;
}

export function detectRecurringTransactions(
  transactions: PlaidTransaction[]
): { income: ComputedRecurringItem[]; expenses: ComputedRecurringItem[]; creditCards: ComputedRecurringItem[] } {
  // Group by merchant
  const byMerchant: Record<string, PlaidTransaction[]> = {};
  for (const tx of transactions) {
    const key = (tx.merchant_name || tx.name).toLowerCase().trim();
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(tx);
  }

  const now = new Date();
  const income: ComputedRecurringItem[] = [];
  const expenses: ComputedRecurringItem[] = [];
  const creditCards: ComputedRecurringItem[] = [];

  for (const [, txs] of Object.entries(byMerchant)) {
    if (txs.length < 2) continue;

    // Sort by date ascending
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

    // Check amount similarity (within 10% tolerance)
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.1);
    if (!allSimilar) continue;

    // Check interval regularity (25-35 days = monthly)
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date + "T00:00:00");
      const d2 = new Date(sorted[i].date + "T00:00:00");
      intervals.push((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    if (avgInterval < 7 || avgInterval > 45) continue;

    const frequency = avgInterval <= 16 ? "Bi-weekly" : "Monthly";
    const lastTx = sorted[sorted.length - 1];
    const lastDate = new Date(lastTx.date + "T00:00:00");
    const nextDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
    const daysUntil = Math.max(0, Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const dayOfMonth = new Date(sorted[0].date + "T00:00:00").getDate();

    const isIncome = lastTx.amount < 0;
    const category = lastTx.category?.[0] || (isIncome ? "Income" : "Other");
    const merchantName = lastTx.merchant_name || lastTx.name;

    // Check if paid this month
    const currentMonthKey = getCurrentMonthKey();
    const paidThisMonth = sorted.some((t) => getMonthKey(t.date) === currentMonthKey);

    const item: ComputedRecurringItem = {
      merchant: merchantName,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      status: paidThisMonth ? "paid" : "upcoming",
      nextDate: nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      daysUntil,
      emoji: getEmoji(category),
      category,
      dueDate: `${dayOfMonth}${getOrdinal(dayOfMonth)}`,
    };

    if (isIncome) {
      income.push(item);
    } else if (category === "Payment" || category === "Credit Card") {
      creditCards.push(item);
    } else {
      expenses.push(item);
    }
  }

  // Sort by next date
  const sortByDays = (a: ComputedRecurringItem, b: ComputedRecurringItem) => a.daysUntil - b.daysUntil;
  income.sort(sortByDays);
  expenses.sort(sortByDays);
  creditCards.sort(sortByDays);

  return { income, expenses, creditCards };
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ---------------------------------------------------------------------------
// Budget computation (actual spending by category for current month)
// ---------------------------------------------------------------------------

export function computeActualSpending(
  transactions: PlaidTransaction[],
  monthKey?: string
): Record<string, number> {
  const targetMonth = monthKey || getCurrentMonthKey();
  const result: Record<string, number> = {};

  for (const tx of transactions) {
    if (getMonthKey(tx.date) !== targetMonth) continue;
    const cat = tx.category?.[1] || tx.category?.[0] || "Other";
    const normalizedCat = cat.toLowerCase().replace(/\s+/g, "-");
    if (tx.amount > 0) {
      result[normalizedCat] = (result[normalizedCat] || 0) + tx.amount;
    } else {
      // Income categories
      const incomeCat = (tx.merchant_name || tx.name || "Other").toLowerCase().replace(/\s+/g, "-");
      result[incomeCat] = (result[incomeCat] || 0) + Math.abs(tx.amount);
    }
  }

  // Round values
  for (const key of Object.keys(result)) {
    result[key] = Math.round(result[key] * 100) / 100;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Dynamic Insights (for Advice page)
// ---------------------------------------------------------------------------

export interface ComputedInsight {
  id: number;
  category: string;
  iconName: string;
  color: string;
  bgColor: string;
  title: string;
  description: string;
  impact: string;
  priority: "high" | "medium" | "positive";
}

export function generateInsights(
  transactions: PlaidTransaction[],
  accounts: PlaidAccount[],
  budgetTargets: Record<string, number>
): ComputedInsight[] {
  const insights: ComputedInsight[] = [];
  let id = 1;

  const currentMonth = getCurrentMonthKey();
  const [year, month] = currentMonth.split("-").map(Number);
  const prevMonth = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;

  // Compute category spending for current and previous month
  const currentSpending: Record<string, number> = {};
  const prevSpending: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const cat = tx.category?.[0] || "Other";
    const mk = getMonthKey(tx.date);
    if (mk === currentMonth) currentSpending[cat] = (currentSpending[cat] || 0) + tx.amount;
    else if (mk === prevMonth) prevSpending[cat] = (prevSpending[cat] || 0) + tx.amount;
  }

  // 1. Spending velocity — categories with significant increases
  for (const [cat, amount] of Object.entries(currentSpending)) {
    const prev = prevSpending[cat] || 0;
    if (prev > 0 && amount > prev * 1.2 && amount > 50) {
      const pctIncrease = Math.round(((amount - prev) / prev) * 100);
      const savings = Math.round(amount - prev);
      insights.push({
        id: id++,
        category: "Spending",
        iconName: "CreditCard",
        color: "#ef4444",
        bgColor: "bg-red-50",
        title: `${cat} spending is up ${pctIncrease}% this month`,
        description: `You've spent $${Math.round(amount)} on ${cat.toLowerCase()} so far, compared to $${Math.round(prev)} last month.`,
        impact: `Save ~$${savings}/month`,
        priority: pctIncrease > 40 ? "high" : "medium",
      });
    }
  }

  // 2. Budget adherence
  for (const [catKey, target] of Object.entries(budgetTargets)) {
    if (target <= 0) continue;
    const normalizedKey = catKey.toLowerCase().replace(/\s+/g, "-");
    // Find matching spending
    const matchingCat = Object.entries(currentSpending).find(
      ([c]) => c.toLowerCase().replace(/\s+/g, "-") === normalizedKey
    );
    if (matchingCat) {
      const [catName, spent] = matchingCat;
      const pct = spent / target;
      if (pct > 0.9) {
        insights.push({
          id: id++,
          category: "Budget",
          iconName: "AlertTriangle",
          color: "#f59e0b",
          bgColor: "bg-amber-50",
          title: `${catName} budget is ${pct >= 1 ? "exceeded" : "almost reached"}`,
          description: `You've spent $${Math.round(spent)} of your $${target} budget for ${catName.toLowerCase()}.`,
          impact: pct >= 1 ? `$${Math.round(spent - target)} over budget` : `$${Math.round(target - spent)} remaining`,
          priority: pct >= 1 ? "high" : "medium",
        });
      }
    }
  }

  // 3. Savings rate
  const totalIncome = transactions
    .filter((t) => t.amount < 0 && getMonthKey(t.date) === currentMonth)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.amount > 0 && getMonthKey(t.date) === currentMonth)
    .reduce((s, t) => s + t.amount, 0);

  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    if (savingsRate > 20) {
      insights.push({
        id: id++,
        category: "Savings",
        iconName: "PiggyBank",
        color: "#10b981",
        bgColor: "bg-emerald-50",
        title: `Great savings rate of ${Math.round(savingsRate)}% this month`,
        description: `You're saving $${Math.round(totalIncome - totalExpenses)} out of $${Math.round(totalIncome)} in income. Keep it up!`,
        impact: "On track",
        priority: "positive",
      });
    } else if (savingsRate < 5 && totalIncome > 500) {
      insights.push({
        id: id++,
        category: "Savings",
        iconName: "AlertTriangle",
        color: "#ef4444",
        bgColor: "bg-red-50",
        title: "Your savings rate is very low this month",
        description: `You've only saved ${Math.round(savingsRate)}% of your income. Consider reducing discretionary spending.`,
        impact: "Needs attention",
        priority: "high",
      });
    }
  }

  // 4. Low balance warning
  for (const account of accounts) {
    if (
      account.type === "depository" &&
      account.current_balance !== null &&
      account.current_balance < 1000 &&
      account.current_balance > 0
    ) {
      insights.push({
        id: id++,
        category: "Protection",
        iconName: "Shield",
        color: "#8b5cf6",
        bgColor: "bg-purple-50",
        title: `Low balance in ${account.name}`,
        description: `Your ${account.name} balance is $${account.current_balance.toFixed(2)}. Consider transferring funds to avoid overdraft.`,
        impact: "Take action",
        priority: "high",
      });
    }
  }

  // 5. Spending decreases (positive)
  for (const [cat, amount] of Object.entries(currentSpending)) {
    const prev = prevSpending[cat] || 0;
    if (prev > 100 && amount < prev * 0.7) {
      const pctDecrease = Math.round(((prev - amount) / prev) * 100);
      insights.push({
        id: id++,
        category: "Spending",
        iconName: "TrendingUp",
        color: "#10b981",
        bgColor: "bg-emerald-50",
        title: `${cat} spending is down ${pctDecrease}%`,
        description: `You've spent $${Math.round(amount)} on ${cat.toLowerCase()}, down from $${Math.round(prev)} last month.`,
        impact: `Saving $${Math.round(prev - amount)}`,
        priority: "positive",
      });
    }
  }

  return insights.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface ComputedNotification {
  id: number;
  iconName: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

export function generateNotifications(
  transactions: PlaidTransaction[],
  accounts: PlaidAccount[],
  recurringItems: { expenses: ComputedRecurringItem[] }
): ComputedNotification[] {
  const notifications: ComputedNotification[] = [];
  let id = 1;
  const now = new Date();

  // 1. Large recent transactions (last 3 days, over $200)
  for (const tx of transactions) {
    const txDate = new Date(tx.date + "T00:00:00");
    const daysAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 3 && Math.abs(tx.amount) > 200) {
      notifications.push({
        id: id++,
        iconName: "CreditCard",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: "Large transaction detected",
        description: `A $${Math.abs(tx.amount).toFixed(2)} charge at ${tx.merchant_name || tx.name} was posted.`,
        time: daysAgo === 0 ? "Today" : `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`,
        unread: daysAgo <= 1,
      });
    }
  }

  // 2. Upcoming recurring bills (within 5 days)
  for (const item of recurringItems.expenses) {
    if (item.status === "upcoming" && item.daysUntil <= 5) {
      notifications.push({
        id: id++,
        iconName: "AlertTriangle",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        title: `${item.merchant} due soon`,
        description: `$${item.amount.toFixed(2)} payment due in ${item.daysUntil} day${item.daysUntil !== 1 ? "s" : ""}.`,
        time: `Due ${item.nextDate}`,
        unread: item.daysUntil <= 2,
      });
    }
  }

  // 3. Low balance alerts
  for (const account of accounts) {
    if (
      account.type === "depository" &&
      account.current_balance !== null &&
      account.current_balance < 500
    ) {
      notifications.push({
        id: id++,
        iconName: "AlertTriangle",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        title: "Low account balance",
        description: `${account.name} balance is $${account.current_balance.toFixed(2)}.`,
        time: "Now",
        unread: true,
      });
    }
  }

  return notifications.slice(0, 10);
}
