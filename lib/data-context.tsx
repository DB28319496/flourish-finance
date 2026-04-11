"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "./auth-context";
import type { PlaidAccount, PlaidTransaction } from "./plaid-service";
import {
  accountGroups as mockAccountGroups,
  transactionGroups as mockTransactionGroups,
  cashFlowMonths as mockCashFlowMonths,
  expenseBreakdown as mockExpenseBreakdown,
  incomeBreakdown as mockIncomeBreakdown,
  monthlyData as mockMonthlyData,
  reportData as mockReportData,
  recurringData as mockRecurringData,
  budgetSections as mockBudgetSections,
  holdingGroups as mockHoldingGroups,
  benchmarks as mockBenchmarks,
  type AccountGroup,
  type TransactionDateGroup,
  type Transaction,
  type CashFlowMonth,
  type CashFlowBreakdown,
  type BudgetCategory,
  type BudgetSection,
  type HoldingGroup,
  type Benchmark,
} from "./mock-data";
import {
  computeCashFlowMonths,
  computeExpenseBreakdown,
  computeIncomeBreakdown,
  computeMonthlyTotals,
  computeTransactionStats,
  flattenTransactions,
  detectRecurringTransactions,
  computeActualSpending,
  generateInsights,
  generateNotifications,
  type TransactionStats,
  type ComputedRecurringItem,
  type ComputedInsight,
  type ComputedNotification,
} from "./compute-finance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataContextType {
  // Existing
  accounts: PlaidAccount[];
  accountGroups: AccountGroup[];
  transactionGroups: TransactionDateGroup[];
  linkedItems: { item_id: string; institution_name: string }[];
  isLoading: boolean;
  isUsingMockData: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  refreshTransactions: (days?: number) => Promise<void>;
  connectBank: () => Promise<void>;
  disconnectBank: (itemId: string) => Promise<void>;
  sendChatMessage: (
    message: string,
    history?: { role: string; content: string }[]
  ) => Promise<string>;

  // Cash Flow
  cashFlowMonths: CashFlowMonth[];
  expensesByCategory: CashFlowBreakdown[];
  incomeBySource: CashFlowBreakdown[];

  // Reports
  monthlyData: { month: string; income: number; expenses: number }[];
  flatTransactions: { merchant: string; category: string; amount: number }[];
  transactionStats: TransactionStats;

  // Recurring
  recurringTransactions: {
    income: ComputedRecurringItem[];
    expenses: ComputedRecurringItem[];
    creditCards: ComputedRecurringItem[];
  };

  // Budget
  budgetSections: BudgetSection[];
  budgetTargets: Record<string, number>;
  updateBudgetTarget: (categoryId: string, amount: number) => Promise<void>;

  // Advice
  insights: ComputedInsight[];

  // Notifications
  notifications: ComputedNotification[];

  // Investments
  holdingGroups: HoldingGroup[];
  benchmarks: Benchmark[];
  refreshInvestments: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// ---------------------------------------------------------------------------
// Helpers: Convert Plaid data to app display types
// ---------------------------------------------------------------------------

function plaidTypeToAccountType(type: string): "cash" | "investments" | "creditCards" | "loans" | "property" {
  switch (type) {
    case "depository": return "cash";
    case "investment": return "investments";
    case "credit": return "creditCards";
    case "loan": return "loans";
    default: return "cash";
  }
}

function plaidAccountsToGroups(accounts: PlaidAccount[]): AccountGroup[] {
  const typeMap: Record<string, { label: string; icon: string; type: "cash" | "investments" | "creditCards" | "loans" }> = {
    depository: { label: "Cash", icon: "Banknote", type: "cash" },
    investment: { label: "Investments", icon: "TrendingUp", type: "investments" },
    credit: { label: "Credit Cards", icon: "CreditCard", type: "creditCards" },
    loan: { label: "Loans", icon: "Building2", type: "loans" },
  };

  const grouped: Record<string, PlaidAccount[]> = {};
  for (const account of accounts) {
    if (!grouped[account.type]) grouped[account.type] = [];
    grouped[account.type].push(account);
  }

  return ["depository", "investment", "credit", "loan"]
    .filter((type) => grouped[type]?.length)
    .map((type) => {
      const meta = typeMap[type] || { label: type, icon: "Building2", type: "cash" as const };
      return {
        id: type,
        type: meta.type,
        label: meta.label,
        icon: meta.icon,
        accounts: grouped[type].map((a) => ({
          id: a.account_id,
          name: `${a.name}${a.mask ? ` ...${a.mask}` : ""}`,
          institution: (a as any).institution_name || "Bank",
          type: plaidTypeToAccountType(a.type),
          subtype: a.subtype || a.type,
          balance: a.current_balance || 0,
          lastSyncedAt: "Just now",
          logoColor: "#4D8FDB",
          monthChange: 0,
          sparklineData: [a.current_balance || 0],
          creditLimit: (a as any).limit || undefined,
        })),
      };
    });
}

function getCategoryEmoji(category: string[] | null, merchantName: string | null): { name: string; emoji: string; group: string } {
  const cat = category?.[0] || "Other";
  const sub = category?.[1] || cat;
  const emojiMap: Record<string, string> = {
    "Food and Drink": "🍽", "Restaurants": "🍽", "Coffee Shop": "☕️",
    "Groceries": "🛒", "Shopping": "🛍", "Travel": "✈️",
    "Transportation": "🚗", "Transfer": "↔️", "Payment": "💳",
    "Recreation": "🎬", "Healthcare": "💊", "Service": "🔧",
    "Rent": "🏠", "Mortgage": "🏠", "Utilities": "💡", "Insurance": "🛡",
  };
  return { name: sub, emoji: emojiMap[cat] || emojiMap[sub] || "💰", group: cat };
}

function plaidTransactionsToGroups(
  transactions: PlaidTransaction[],
  accountMap: Map<string, PlaidAccount>
): TransactionDateGroup[] {
  const grouped: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    const account = accountMap.get(tx.account_id);
    const accountName = (tx as any).account_name ||
      (account ? `${account.name}${account.mask ? ` ...${account.mask}` : ""}` : "Unknown");

    grouped[tx.date].push({
      id: tx.transaction_id,
      merchantName: tx.merchant_name || tx.name,
      originalStatement: tx.name,
      amount: Math.abs(tx.amount),
      date: tx.date,
      category: getCategoryEmoji(tx.category, tx.merchant_name),
      accountName,
      accountId: tx.account_id,
      isPending: tx.pending,
      isRecurring: false,
      isFlagged: false,
      notes: "",
    });
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, transactions]) => ({ id: date, date, transactions }));
}

// ---------------------------------------------------------------------------
// Budget helpers: build sections from transaction data + saved targets
// ---------------------------------------------------------------------------

function buildBudgetSections(
  transactions: PlaidTransaction[],
  budgetTargets: Record<string, number>
): BudgetSection[] {
  const actualSpending = computeActualSpending(transactions);

  // Build category list from actual spending + saved targets
  const allCategories = Array.from(new Set([
    ...Object.keys(actualSpending),
    ...Object.keys(budgetTargets),
  ]));

  const EMOJI_MAP: Record<string, string> = {
    "food-and-drink": "🍽", "restaurants": "🍽", "restaurants-&-bars": "🍽",
    "groceries": "🛒", "shopping": "🛍", "travel": "✈️",
    "transportation": "🚗", "auto-payment": "🚗", "transfer": "↔️",
    "payment": "💳", "recreation": "🎬", "healthcare": "💊",
    "rent": "🏠", "mortgage": "🏠", "utilities": "💡",
    "insurance": "🛡", "entertainment": "🎬", "education": "📚",
    "gas-&-electric": "⚡️", "internet-&-cable": "🌐", "fitness": "💪",
    "coffee-shops": "☕️", "medical": "💊", "travel-&-vacation": "🏝",
    "paychecks": "💵", "other-income": "💰",
  };

  const categories: BudgetCategory[] = [];
  for (const cat of allCategories) {
    const displayName = cat
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    categories.push({
      id: cat,
      name: displayName,
      emoji: EMOJI_MAP[cat] || "💰",
      group: "Spending",
      budgetAmount: budgetTargets[cat] || 0,
      actualAmount: Math.round((actualSpending[cat] || 0) * 100) / 100,
    });
  }

  // Sort by actual amount descending
  categories.sort((a, b) => b.actualAmount - a.actualAmount);

  // Split into sections
  const incomeCategories = categories.filter((c) => c.name.toLowerCase().includes("paycheck") || c.name.toLowerCase().includes("income"));
  const fixedCategories = categories.filter((c) => c.budgetAmount > 0 && !incomeCategories.includes(c));
  const flexibleCategories = categories.filter((c) => c.budgetAmount === 0 && c.actualAmount > 0 && !incomeCategories.includes(c));

  const sections: BudgetSection[] = [];
  if (incomeCategories.length > 0) {
    sections.push({ id: "income", name: "Income", type: "income", categories: incomeCategories });
  }
  if (fixedCategories.length > 0) {
    sections.push({ id: "fixed", name: "Fixed & Budgeted", type: "fixed", categories: fixedCategories });
  }
  if (flexibleCategories.length > 0) {
    sections.push({ id: "flex", name: "Flexible", type: "flexible", categories: flexibleCategories });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Authenticated fetch helper
// ---------------------------------------------------------------------------

async function apiFetch(path: string, token: string, body?: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, getIdToken } = useAuth();

  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [rawTransactions, setRawTransactions] = useState<PlaidTransaction[]>([]);
  const [linkedItems, setLinkedItems] = useState<{ item_id: string; institution_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({});
  const [investmentHoldings, setInvestmentHoldings] = useState<HoldingGroup[]>([]);

  const isUsingMockData = !user;

  // -- Account groups
  const accountGroups = isUsingMockData ? mockAccountGroups : plaidAccountsToGroups(accounts);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.account_id, a])), [accounts]);
  const transactionGroups = isUsingMockData
    ? mockTransactionGroups
    : plaidTransactionsToGroups(rawTransactions, accountMap);

  // -- Cash flow (computed from transactions)
  const cashFlowMonths = useMemo(
    () => (isUsingMockData ? mockCashFlowMonths : computeCashFlowMonths(rawTransactions, 6)),
    [isUsingMockData, rawTransactions]
  );

  const expensesByCategory = useMemo(
    () => (isUsingMockData ? mockExpenseBreakdown : computeExpenseBreakdown(rawTransactions)),
    [isUsingMockData, rawTransactions]
  );

  const incomeBySource = useMemo(
    () => (isUsingMockData ? mockIncomeBreakdown : computeIncomeBreakdown(rawTransactions)),
    [isUsingMockData, rawTransactions]
  );

  // -- Reports data
  const monthlyData = useMemo(
    () => (isUsingMockData ? mockMonthlyData : computeMonthlyTotals(rawTransactions, 6)),
    [isUsingMockData, rawTransactions]
  );

  const flatTransactions = useMemo(
    () => (isUsingMockData ? mockReportData.transactions : flattenTransactions(rawTransactions)),
    [isUsingMockData, rawTransactions]
  );

  const transactionStats = useMemo(
    () => computeTransactionStats(isUsingMockData ? [] : rawTransactions),
    [isUsingMockData, rawTransactions]
  );

  // -- Recurring
  const recurringTransactions = useMemo(
    () => (isUsingMockData ? mockRecurringData as any : detectRecurringTransactions(rawTransactions)),
    [isUsingMockData, rawTransactions]
  );

  // -- Budget
  const budgetSections = useMemo(
    () => (isUsingMockData ? mockBudgetSections : buildBudgetSections(rawTransactions, budgetTargets)),
    [isUsingMockData, rawTransactions, budgetTargets]
  );

  // -- Advice / Insights
  const insights = useMemo(
    () => (isUsingMockData ? [] : generateInsights(rawTransactions, accounts, budgetTargets)),
    [isUsingMockData, rawTransactions, accounts, budgetTargets]
  );

  // -- Notifications
  const notifications = useMemo(
    () => (isUsingMockData ? [] : generateNotifications(rawTransactions, accounts, recurringTransactions as any)),
    [isUsingMockData, rawTransactions, accounts, recurringTransactions]
  );

  // -- Investments
  const holdingGroups = useMemo(
    () => (isUsingMockData || investmentHoldings.length === 0 ? mockHoldingGroups : investmentHoldings),
    [isUsingMockData, investmentHoldings]
  );

  const benchmarks = mockBenchmarks; // Always mock until market data API is added

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const refreshAccounts = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    try {
      const data = await apiFetch("/api/plaid/accounts", token);
      if (data.accounts) setAccounts(data.accounts);
      if (data.items) setLinkedItems(data.items);
    } catch (err: any) {
      console.error("Failed to refresh accounts:", err);
      setError(err.message);
    }
  }, [getIdToken]);

  const refreshTransactions = useCallback(async (days = 90) => {
    const token = await getIdToken();
    if (!token) return;
    try {
      const data = await apiFetch("/api/plaid/transactions", token, { days });
      if (data.transactions) setRawTransactions(data.transactions);
    } catch (err: any) {
      console.error("Failed to refresh transactions:", err);
      setError(err.message);
    }
  }, [getIdToken]);

  const refreshInvestments = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    try {
      const data = await apiFetch("/api/plaid/investments", token);
      if (data.holdingGroups) setInvestmentHoldings(data.holdingGroups);
    } catch (err: any) {
      // Investments endpoint may not exist yet — fail silently
      console.warn("Failed to refresh investments:", err);
    }
  }, [getIdToken]);

  const connectBank = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const { link_token } = await apiFetch("/api/plaid/create-link-token", token);
    (window as any).__flourish_link_token = link_token;
    window.dispatchEvent(new CustomEvent("flourish:open-plaid-link", { detail: { link_token } }));
  }, [getIdToken]);

  const disconnectBank = useCallback(async (itemId: string) => {
    const token = await getIdToken();
    if (!token) return;
    await apiFetch("/api/plaid/remove-item", token, { item_id: itemId });
    await refreshAccounts();
    await refreshTransactions();
  }, [getIdToken, refreshAccounts, refreshTransactions]);

  const updateBudgetTarget = useCallback(async (categoryId: string, amount: number) => {
    const newTargets = { ...budgetTargets, [categoryId]: amount };
    setBudgetTargets(newTargets);

    // Persist to Firestore if authenticated
    if (user) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        if (!db) return;
        await setDoc(
          doc(db, "users", user.uid, "settings", "budget_targets"),
          newTargets,
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to save budget targets:", err);
      }
    }
  }, [budgetTargets, user]);

  const sendChatMessage = useCallback(async (
    message: string,
    history: { role: string; content: string }[] = []
  ): Promise<string> => {
    const token = await getIdToken();
    if (!token) throw new Error("Not authenticated");

    const totalAssets = accounts
      .filter((a) => a.type !== "credit" && a.type !== "loan")
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === "credit" || a.type === "loan")
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);

    const financialContext = `
Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}
Total Assets: $${totalAssets.toFixed(2)}
Total Liabilities: $${totalLiabilities.toFixed(2)}
Accounts: ${accounts.map((a) => `${a.name} (${a.type}): $${(a.current_balance || 0).toFixed(2)}`).join(", ")}
Recent Transactions: ${rawTransactions.slice(0, 20).map((t) => `${t.date}: ${t.merchant_name || t.name} $${t.amount}`).join("; ")}
    `.trim();

    const data = await apiFetch("/api/chat", token, {
      message,
      conversationHistory: history,
      financialContext,
    });
    return data.response;
  }, [getIdToken, accounts, rawTransactions]);

  // ---------------------------------------------------------------------------
  // Load on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // Load budget targets from Firestore
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("./firebase");
        if (!db) return;
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "budget_targets"));
        if (snap.exists()) setBudgetTargets(snap.data() as Record<string, number>);
      } catch (err) {
        console.warn("Failed to load budget targets:", err);
      }
    })();

    Promise.all([refreshAccounts(), refreshTransactions(90), refreshInvestments()])
      .finally(() => setIsLoading(false));
  }, [user, refreshAccounts, refreshTransactions, refreshInvestments]);

  return (
    <DataContext.Provider
      value={{
        accounts, accountGroups, transactionGroups, linkedItems,
        isLoading, isUsingMockData, error,
        refreshAccounts, refreshTransactions, connectBank, disconnectBank,
        sendChatMessage,
        // Computed
        cashFlowMonths, expensesByCategory, incomeBySource,
        monthlyData, flatTransactions, transactionStats,
        recurringTransactions,
        budgetSections, budgetTargets, updateBudgetTarget,
        insights, notifications,
        holdingGroups, benchmarks, refreshInvestments,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
