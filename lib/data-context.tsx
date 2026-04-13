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
  type Goal,
  type UserSettings,
  type TransactionEdit,
  type CategorizationRule,
  type TransactionSplit,
  type ManualAccount,
} from "./mock-data";
import * as firestore from "./firestore-helpers";
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
  detectTransfers,
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
  visibleAccountGroups: AccountGroup[];
  transactionGroups: TransactionDateGroup[];
  rawTransactions: PlaidTransaction[];
  linkedItems: { item_id: string; institution_name: string }[];
  brokenItems: { item_id: string; error_code: string; needs_reauth: boolean }[];
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
  ) => Promise<{ response: string; actions: { tool: string; input: any; result: any }[] }>;
  refreshAllUserData: () => Promise<void>;

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

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Settings
  userSettings: UserSettings;
  updateUserSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;

  // Transaction edits (merged into transactionGroups)
  transactionEdits: Record<string, TransactionEdit>;
  updateTransaction: (txId: string, edits: TransactionEdit) => Promise<void>;

  // Net worth timeline
  netWorthTimeline: { date: string; value: number }[];

  // Phase 1: Transfer detection
  transferIds: Set<string>;
  markAsTransfer: (transactionId: string, isTransfer: boolean) => Promise<void>;

  // Phase 1: Hidden accounts
  hiddenAccountIds: Set<string>;
  toggleAccountHidden: (accountId: string) => Promise<void>;

  // Phase 1: Category overrides
  getDisplayCategory: (rawCategory: string) => string;
  renameCategory: (rawCategory: string, newName: string) => Promise<void>;

  // Phase 1: Rules
  rules: CategorizationRule[];
  addRule: (rule: Omit<CategorizationRule, "id" | "createdAt">) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;

  // Phase 1: Splits
  splits: Record<string, TransactionSplit>;
  updateSplit: (txId: string, splits: TransactionSplit["splits"]) => Promise<void>;
  deleteSplit: (txId: string) => Promise<void>;

  // Phase 4: Manual accounts
  manualAccounts: ManualAccount[];
  addManualAccount: (account: Omit<ManualAccount, "id" | "createdAt" | "lastUpdated">) => Promise<void>;
  updateManualAccount: (id: string, updates: Partial<ManualAccount>) => Promise<void>;
  deleteManualAccount: (id: string) => Promise<void>;
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
          item_id: (a as any).item_id,
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
        })) as any,
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
  budgetTargets: Record<string, number>,
  transferIds?: Set<string>
): BudgetSection[] {
  const actualSpending = computeActualSpending(transactions, undefined, transferIds);

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
  const [brokenItems, setBrokenItems] = useState<{ item_id: string; error_code: string; needs_reauth: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({});
  const [investmentHoldings, setInvestmentHoldings] = useState<HoldingGroup[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({});
  const [transactionEdits, setTransactionEdits] = useState<Record<string, TransactionEdit>>({});
  const [netWorthSnapshots, setNetWorthSnapshots] = useState<{ date: string; value: number }[]>([]);
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [splits, setSplits] = useState<Record<string, TransactionSplit>>({});
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([]);

  // Use mock data if not logged in OR if logged in but no real data was fetched
  const hasRealData = accounts.length > 0 || rawTransactions.length > 0;
  const isUsingMockData = !user || (!hasRealData && !isLoading);

  // Phase 1: Compute transfer IDs once, then apply user overrides
  const transferIds = useMemo(() => {
    if (isUsingMockData) return new Set<string>();
    const auto = detectTransfers(rawTransactions);
    // Apply user overrides
    for (const txId of userSettings.manualTransferIds || []) auto.add(txId);
    for (const txId of userSettings.nonTransferIds || []) auto.delete(txId);
    return auto;
  }, [isUsingMockData, rawTransactions, userSettings.manualTransferIds, userSettings.nonTransferIds]);

  // Phase 1: Hidden accounts
  const hiddenAccountIds = useMemo(
    () => new Set(userSettings.hiddenAccounts || []),
    [userSettings.hiddenAccounts]
  );

  // Phase 1: Category display helper
  const getDisplayCategory = useCallback((rawCategory: string): string => {
    return userSettings.categoryOverrides?.[rawCategory] || rawCategory;
  }, [userSettings.categoryOverrides]);

  // -- Account groups: full list (shown on Accounts page with hide toggles)
  // Merges Plaid-sourced accounts with user-created manual accounts
  const accountGroups = useMemo(() => {
    const plaidGroups = isUsingMockData ? mockAccountGroups : plaidAccountsToGroups(accounts);

    if (manualAccounts.length === 0) return plaidGroups;

    // Group manual accounts by type
    const manualByType: Record<string, ManualAccount[]> = {};
    for (const m of manualAccounts) {
      const t = m.type || "other";
      if (!manualByType[t]) manualByType[t] = [];
      manualByType[t].push(m);
    }

    // Merge into existing groups or create new ones
    const typeMeta: Record<string, { label: string; icon: string; groupId: string }> = {
      cash: { label: "Cash", icon: "Banknote", groupId: "depository" },
      investments: { label: "Investments", icon: "TrendingUp", groupId: "invest" },
      creditCards: { label: "Credit Cards", icon: "CreditCard", groupId: "credit" },
      loans: { label: "Loans", icon: "Building2", groupId: "loan" },
      property: { label: "Property", icon: "Home", groupId: "property" },
      crypto: { label: "Crypto", icon: "Bitcoin", groupId: "crypto" },
      other: { label: "Other Assets", icon: "Wallet", groupId: "other" },
    };

    const merged = [...plaidGroups];
    for (const [type, items] of Object.entries(manualByType)) {
      const meta = typeMeta[type] || { label: type, icon: "Wallet", groupId: type };
      const existingGroup = merged.find((g) => g.type === (type as any) || g.id === meta.groupId);
      const manualAsAccount = items.map((m) => ({
        id: m.id,
        item_id: "manual",
        name: m.name,
        institution: m.institution || "Manual",
        type: m.type as any,
        subtype: m.subtype || m.type,
        balance: m.balance,
        lastSyncedAt: m.lastUpdated ? new Date(m.lastUpdated).toLocaleDateString() : "Manual entry",
        logoColor: "#E5633A",
        monthChange: 0,
        sparklineData: [m.balance],
        isManual: true,
      })) as any;

      if (existingGroup) {
        existingGroup.accounts = [...existingGroup.accounts, ...manualAsAccount];
      } else {
        merged.push({
          id: meta.groupId,
          type: (type === "crypto" || type === "property" || type === "other" ? "investments" : type) as any,
          label: meta.label,
          icon: meta.icon,
          accounts: manualAsAccount,
        } as any);
      }
    }

    return merged;
  }, [isUsingMockData, accounts, manualAccounts]);

  // -- Visible account groups: filtered for totals, charts, dashboard KPIs
  const visibleAccountGroups = useMemo(() => {
    if (hiddenAccountIds.size === 0) return accountGroups;
    return accountGroups
      .map((g) => ({ ...g, accounts: g.accounts.filter((a) => !hiddenAccountIds.has(a.id)) }))
      .filter((g) => g.accounts.length > 0);
  }, [accountGroups, hiddenAccountIds]);
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.account_id, a])), [accounts]);

  // Apply rules engine — find any matching rule for a transaction
  const applyRules = useCallback((merchantName: string): CategorizationRule | null => {
    if (rules.length === 0) return null;
    const nameLower = merchantName.toLowerCase();
    for (const rule of rules) {
      if (!rule.merchantPattern) continue;
      if (nameLower.includes(rule.merchantPattern.toLowerCase())) return rule;
    }
    return null;
  }, [rules]);

  // Apply transaction edits + rules + category overrides + hidden accounts
  const transactionGroups = useMemo(() => {
    const base = isUsingMockData
      ? mockTransactionGroups
      : plaidTransactionsToGroups(rawTransactions, accountMap);

    return base
      .map((group) => ({
        ...group,
        transactions: group.transactions
          .filter((tx) => !hiddenAccountIds.has(tx.accountId))
          .map((tx) => {
            const edit = transactionEdits[tx.id];
            const rule = applyRules(edit?.merchantName || tx.merchantName);
            const isTransfer = transferIds.has(tx.id);

            const categoryName = edit?.category ?? rule?.setCategory ?? tx.category.name;
            const displayCategory = getDisplayCategory(categoryName);

            return {
              ...tx,
              merchantName: edit?.merchantName ?? tx.merchantName,
              notes: edit?.notes ?? tx.notes,
              isFlagged: edit?.isFlagged ?? rule?.setFlag ?? tx.isFlagged,
              isRecurring: edit?.isRecurring ?? rule?.setRecurring ?? tx.isRecurring,
              isTransfer,
              tags: edit?.tags || [],
              category: { ...tx.category, name: displayCategory },
            } as any;
          }),
      }))
      .filter((g) => g.transactions.length > 0);
  }, [isUsingMockData, rawTransactions, accountMap, transactionEdits, hiddenAccountIds, applyRules, transferIds, getDisplayCategory]);

  // -- Cash flow (computed from transactions)
  const cashFlowMonths = useMemo(
    () => (isUsingMockData ? mockCashFlowMonths : computeCashFlowMonths(rawTransactions, 6, transferIds)),
    [isUsingMockData, rawTransactions, transferIds]
  );

  const expensesByCategory = useMemo(
    () => (isUsingMockData ? mockExpenseBreakdown : computeExpenseBreakdown(rawTransactions, undefined, transferIds)),
    [isUsingMockData, rawTransactions, transferIds]
  );

  const incomeBySource = useMemo(
    () => (isUsingMockData ? mockIncomeBreakdown : computeIncomeBreakdown(rawTransactions, undefined, transferIds)),
    [isUsingMockData, rawTransactions, transferIds]
  );

  // -- Reports data
  const monthlyData = useMemo(
    () => (isUsingMockData ? mockMonthlyData : computeMonthlyTotals(rawTransactions, 6, transferIds)),
    [isUsingMockData, rawTransactions, transferIds]
  );

  const flatTransactions = useMemo(
    () => (isUsingMockData ? mockReportData.transactions : flattenTransactions(rawTransactions)),
    [isUsingMockData, rawTransactions]
  );

  const transactionStats = useMemo(
    () => computeTransactionStats(isUsingMockData ? [] : rawTransactions),
    [isUsingMockData, rawTransactions]
  );

  // -- Recurring (filter out user-excluded merchants)
  const recurringTransactions = useMemo(() => {
    if (isUsingMockData) return mockRecurringData as any;
    const detected = detectRecurringTransactions(rawTransactions);
    const excluded = new Set((userSettings.excludedRecurring || []).map((m) => m.toLowerCase()));
    if (excluded.size === 0) return detected;
    const filter = (items: any[]) => items.filter((i) => !excluded.has(i.merchant.toLowerCase()));
    return {
      income: filter(detected.income),
      expenses: filter(detected.expenses),
      creditCards: filter(detected.creditCards),
    };
  }, [isUsingMockData, rawTransactions, userSettings.excludedRecurring]);

  // -- Budget
  const budgetSections = useMemo(
    () => (isUsingMockData ? mockBudgetSections : buildBudgetSections(rawTransactions, budgetTargets, transferIds)),
    [isUsingMockData, rawTransactions, budgetTargets, transferIds]
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

  // -- Investments (only fall back to mock when truly unauthenticated)
  const holdingGroups = useMemo(
    () => (!user ? mockHoldingGroups : investmentHoldings),
    [user, investmentHoldings]
  );

  const benchmarks = mockBenchmarks; // Always mock until market data API is added

  // -- Net worth timeline (combine snapshots with current value)
  const netWorthTimeline = useMemo(() => {
    if (isUsingMockData || netWorthSnapshots.length === 0) {
      // Fall back to generated timeline (mock)
      const points: { date: string; value: number }[] = [];
      const totalAssets = accounts
        .filter((a) => a.type !== "credit" && a.type !== "loan")
        .reduce((s, a) => s + (a.current_balance || 0), 0);
      const totalLiabilities = accounts
        .filter((a) => a.type === "credit" || a.type === "loan")
        .reduce((s, a) => s + (a.current_balance || 0), 0);
      const current = isUsingMockData ? 56059.78 : totalAssets - totalLiabilities;

      for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const progress = (30 - i) / 30;
        points.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: current * 0.95 + current * 0.05 * progress + (Math.random() - 0.5) * 500,
        });
      }
      return points;
    }

    // Sort snapshots by date and format for chart
    return netWorthSnapshots
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        date: new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: s.value,
      }));
  }, [isUsingMockData, netWorthSnapshots, accounts]);

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
      if (data.brokenItems) setBrokenItems(data.brokenItems);
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

  // Goals
  const addGoal = useCallback(async (goal: Omit<Goal, "id" | "createdAt">) => {
    const id = `goal_${Date.now()}`;
    const newGoal: Goal = { ...goal, id, createdAt: Date.now() };
    setGoals((prev) => [...prev, newGoal]);
    if (user) await firestore.setDoc(user.uid, ["goals", id], newGoal as any);
  }, [user]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    if (user) await firestore.setDoc(user.uid, ["goals", id], updates as any);
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (user) await firestore.deleteDoc(user.uid, ["goals", id]);
  }, [user]);

  // User Settings
  const updateUserSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...userSettings, [key]: value };
    setUserSettings(newSettings);
    if (user) await firestore.setDoc(user.uid, ["settings", "user"], newSettings as any);
  }, [userSettings, user]);

  // Transaction edits
  const updateTransaction = useCallback(async (txId: string, edits: TransactionEdit) => {
    const merged = { ...transactionEdits[txId], ...edits };
    setTransactionEdits((prev) => ({ ...prev, [txId]: merged }));
    if (user) await firestore.setDoc(user.uid, ["transaction_edits", txId], merged as any);
  }, [transactionEdits, user]);

  // Phase 1: Mark/unmark as transfer
  const markAsTransfer = useCallback(async (transactionId: string, isTransfer: boolean) => {
    const manual = userSettings.manualTransferIds || [];
    const nonTransfer = userSettings.nonTransferIds || [];
    const newManual = isTransfer ? Array.from(new Set([...manual, transactionId])) : manual.filter((id) => id !== transactionId);
    const newNon = !isTransfer ? Array.from(new Set([...nonTransfer, transactionId])) : nonTransfer.filter((id) => id !== transactionId);
    const newSettings = { ...userSettings, manualTransferIds: newManual, nonTransferIds: newNon };
    setUserSettings(newSettings);
    if (user) await firestore.setDoc(user.uid, ["settings", "user"], newSettings as any);
  }, [userSettings, user]);

  // Phase 1: Toggle account hidden
  const toggleAccountHidden = useCallback(async (accountId: string) => {
    const current = userSettings.hiddenAccounts || [];
    const next = current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId];
    const newSettings = { ...userSettings, hiddenAccounts: next };
    setUserSettings(newSettings);
    if (user) await firestore.setDoc(user.uid, ["settings", "user"], newSettings as any);
  }, [userSettings, user]);

  // Phase 1: Rename a category
  const renameCategory = useCallback(async (rawCategory: string, newName: string) => {
    const overrides = { ...(userSettings.categoryOverrides || {}) };
    if (!newName.trim() || newName === rawCategory) {
      delete overrides[rawCategory];
    } else {
      overrides[rawCategory] = newName.trim();
    }
    const newSettings = { ...userSettings, categoryOverrides: overrides };
    setUserSettings(newSettings);
    if (user) await firestore.setDoc(user.uid, ["settings", "user"], newSettings as any);
  }, [userSettings, user]);

  // Phase 1: Rules
  const addRule = useCallback(async (rule: Omit<CategorizationRule, "id" | "createdAt">) => {
    const id = `rule_${Date.now()}`;
    const newRule: CategorizationRule = { ...rule, id, createdAt: Date.now() };
    setRules((prev) => [...prev, newRule]);
    if (user) await firestore.setDoc(user.uid, ["rules", id], newRule as any);
  }, [user]);

  const deleteRule = useCallback(async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    if (user) await firestore.deleteDoc(user.uid, ["rules", id]);
  }, [user]);

  // Phase 1: Splits
  const updateSplit = useCallback(async (txId: string, splitList: TransactionSplit["splits"]) => {
    const split: TransactionSplit = { id: txId, splits: splitList };
    setSplits((prev) => ({ ...prev, [txId]: split }));
    if (user) await firestore.setDoc(user.uid, ["transaction_splits", txId], split as any);
  }, [user]);

  const deleteSplit = useCallback(async (txId: string) => {
    setSplits((prev) => {
      const next = { ...prev };
      delete next[txId];
      return next;
    });
    if (user) await firestore.deleteDoc(user.uid, ["transaction_splits", txId]);
  }, [user]);

  // Phase 4: Manual accounts CRUD
  const addManualAccount = useCallback(async (account: Omit<ManualAccount, "id" | "createdAt" | "lastUpdated">) => {
    const id = `manual_${Date.now()}`;
    const now = Date.now();
    const newAccount: ManualAccount = { ...account, id, createdAt: now, lastUpdated: now };
    setManualAccounts((prev) => [...prev, newAccount]);
    if (user) await firestore.setDoc(user.uid, ["manual_accounts", id], newAccount as any);
  }, [user]);

  const updateManualAccount = useCallback(async (id: string, updates: Partial<ManualAccount>) => {
    const merged = { ...updates, lastUpdated: Date.now() };
    setManualAccounts((prev) => prev.map((m) => (m.id === id ? { ...m, ...merged } : m)));
    if (user) await firestore.setDoc(user.uid, ["manual_accounts", id], merged as any);
  }, [user]);

  const deleteManualAccount = useCallback(async (id: string) => {
    setManualAccounts((prev) => prev.filter((m) => m.id !== id));
    if (user) await firestore.deleteDoc(user.uid, ["manual_accounts", id]);
  }, [user]);

  const sendChatMessage = useCallback(async (
    message: string,
    history: { role: string; content: string }[] = []
  ): Promise<{ response: string; actions: { tool: string; input: any; result: any }[] }> => {
    const token = await getIdToken();
    if (!token) throw new Error("Not authenticated");

    const totalAssets = accounts
      .filter((a) => a.type !== "credit" && a.type !== "loan")
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === "credit" || a.type === "loan")
      .reduce((sum, a) => sum + (a.current_balance || 0), 0);

    // Group accounts by type
    const accountsByType: Record<string, typeof accounts> = {};
    for (const a of accounts) {
      const t = a.type || "other";
      if (!accountsByType[t]) accountsByType[t] = [];
      accountsByType[t].push(a);
    }

    // Current month spending totals by category
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTxs = rawTransactions.filter((t) => t.date.startsWith(currentMonth));
    const spendByCategory: Record<string, number> = {};
    let monthIncome = 0;
    let monthSpending = 0;
    for (const tx of currentMonthTxs) {
      if (tx.amount < 0) {
        monthIncome += Math.abs(tx.amount);
      } else {
        monthSpending += tx.amount;
        const cat = tx.category?.[0] || "Other";
        spendByCategory[cat] = (spendByCategory[cat] || 0) + tx.amount;
      }
    }

    // Top 10 transactions by absolute amount (most impactful)
    const topTxs = [...rawTransactions]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 10);

    const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Holdings across all accounts
    const allHoldings = holdingGroups.flatMap((g) =>
      g.holdings.map((h) => ({ ...h, accountName: g.accountName }))
    );

    const financialContext = `
**Net Worth Snapshot**
- Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}
- Total Assets: $${totalAssets.toFixed(2)}
- Total Liabilities: $${totalLiabilities.toFixed(2)}
- Savings Rate (${monthName}): ${monthIncome > 0 ? (((monthIncome - monthSpending) / monthIncome) * 100).toFixed(1) : "0"}%

**Accounts by Type** (account_id in brackets — use for hide_account tool)
${Object.entries(accountsByType).map(([type, accts]) => {
  const total = accts.reduce((s, a) => s + (a.current_balance || 0), 0);
  return `${type} ($${total.toFixed(2)} total):\n${accts.map((a) => `  - [${a.account_id}] ${a.name}${(a as any).mask ? ` ...${(a as any).mask}` : ""}: $${(a.current_balance || 0).toFixed(2)}${(a as any).limit ? ` (limit: $${(a as any).limit})` : ""}`).join("\n")}`;
}).join("\n\n")}

**${monthName} Activity**
- Income: $${monthIncome.toFixed(2)}
- Spending: $${monthSpending.toFixed(2)}
- Net: $${(monthIncome - monthSpending).toFixed(2)}
- Transaction count: ${currentMonthTxs.length}

**Top Spending Categories (${monthName})**
${Object.entries(spendByCategory)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)} (${((amount / monthSpending) * 100).toFixed(1)}%)`)
  .join("\n")}

**Investment Holdings**
${allHoldings.length === 0 ? "(none yet — may require reconnecting with Plaid Investments product)" :
  allHoldings.map((h) => `- ${h.ticker} (${h.name}) in ${h.accountName}: ${h.quantity.toFixed(4)} shares, $${h.value.toFixed(2)} value, $${(h.costBasis || 0).toFixed(2)} cost basis${h.costBasis > 0 ? ` (${(((h.value - h.costBasis) / h.costBasis) * 100).toFixed(1)}% return)` : ""}`).join("\n")}

**Goals**
${goals.length === 0 ? "(none)" :
  goals.map((g) => `- [${g.id}] ${g.name} (${g.icon || "🎯"}): $${g.current}/$${g.target} (${((g.current / (g.target || 1)) * 100).toFixed(0)}%), target ${g.deadline}, $${g.monthlyContribution}/mo`).join("\n")}

**Active Budget Targets**
${Object.keys(budgetTargets).length === 0 ? "(none set)" :
  Object.entries(budgetTargets).map(([cat, amount]) => `- ${cat}: $${amount}/mo`).join("\n")}

**Auto-categorization Rules**
${rules.length === 0 ? "(none)" :
  rules.map((r) => `- When merchant contains "${r.merchantPattern}" → ${r.setCategory ? `category=${r.setCategory}` : ""}${r.setRecurring ? ", recurring" : ""}${r.setFlag ? ", flag" : ""}`).join("\n")}

**Recent Notable Transactions**
${topTxs.map((t) => `- ${t.date}: [${t.transaction_id}] ${t.merchant_name || t.name} — ${t.amount > 0 ? "-" : "+"}$${Math.abs(t.amount).toFixed(2)} [${t.category?.[0] || "Other"}]`).join("\n")}

**Last 30 Transactions** (tx_id in brackets — use for update_transaction tool)
${rawTransactions.slice(0, 30).map((t) => `- ${t.date}: [${t.transaction_id}] ${t.merchant_name || t.name} ${t.amount > 0 ? "-" : "+"}$${Math.abs(t.amount).toFixed(2)}`).join("\n")}
    `.trim();

    const data = await apiFetch("/api/chat", token, {
      message,
      conversationHistory: history,
      financialContext,
    });
    return { response: data.response, actions: data.actions || [] };
  }, [getIdToken, accounts, rawTransactions, holdingGroups, goals, budgetTargets, rules]);

  // Refresh all user-specific Firestore data (used after AI actions)
  const refreshAllUserData = useCallback(async () => {
    if (!user) return;
    const [budgets, settings, userGoals, edits, userManual, userRules] = await Promise.all([
      firestore.getDoc<Record<string, number>>(user.uid, ["settings", "budget_targets"]),
      firestore.getDoc<UserSettings>(user.uid, ["settings", "user"]),
      firestore.listCollection<Goal>(user.uid, "goals"),
      firestore.listCollection<TransactionEdit & { id: string }>(user.uid, "transaction_edits"),
      firestore.listCollection<ManualAccount>(user.uid, "manual_accounts"),
      firestore.listCollection<CategorizationRule>(user.uid, "rules"),
    ]);
    if (budgets) setBudgetTargets(budgets);
    if (settings) setUserSettings(settings);
    setGoals(userGoals);
    setTransactionEdits(Object.fromEntries(edits.map((e) => [e.id, e as TransactionEdit])));
    setManualAccounts(userManual);
    setRules(userRules);
  }, [user]);

  // ---------------------------------------------------------------------------
  // Load on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // Load all user data from Firestore in parallel
    (async () => {
      const [budgets, settings, userGoals, edits, snapshots, userRules, userSplits, userManual] = await Promise.all([
        firestore.getDoc<Record<string, number>>(user.uid, ["settings", "budget_targets"]),
        firestore.getDoc<UserSettings>(user.uid, ["settings", "user"]),
        firestore.listCollection<Goal>(user.uid, "goals"),
        firestore.listCollection<TransactionEdit & { id: string }>(user.uid, "transaction_edits"),
        firestore.listCollection<{ value: number }>(user.uid, "snapshots"),
        firestore.listCollection<CategorizationRule>(user.uid, "rules"),
        firestore.listCollection<TransactionSplit>(user.uid, "transaction_splits"),
        firestore.listCollection<ManualAccount>(user.uid, "manual_accounts"),
      ]);

      if (budgets) setBudgetTargets(budgets);
      if (settings) setUserSettings(settings);
      setGoals(userGoals);
      setTransactionEdits(
        Object.fromEntries(edits.map((e) => [e.id, e as TransactionEdit]))
      );
      setNetWorthSnapshots(snapshots.map((s) => ({ date: s.id, value: s.value })));
      setRules(userRules);
      setSplits(Object.fromEntries(userSplits.map((s) => [s.id, s])));
      setManualAccounts(userManual);
    })();

    Promise.all([refreshAccounts(), refreshTransactions(90), refreshInvestments()])
      .finally(() => setIsLoading(false));
  }, [user, refreshAccounts, refreshTransactions, refreshInvestments]);

  // Save today's net worth snapshot when accounts update
  useEffect(() => {
    if (!user || accounts.length === 0) return;
    const totalAssets = accounts
      .filter((a) => a.type !== "credit" && a.type !== "loan")
      .reduce((s, a) => s + (a.current_balance || 0), 0);
    const totalLiabilities = accounts
      .filter((a) => a.type === "credit" || a.type === "loan")
      .reduce((s, a) => s + (a.current_balance || 0), 0);
    const value = totalAssets - totalLiabilities;

    const today = new Date().toISOString().split("T")[0];
    firestore.setDoc(user.uid, ["snapshots", today], {
      value,
      assets: totalAssets,
      liabilities: totalLiabilities,
      timestamp: Date.now(),
    });

    // Update local snapshot array
    setNetWorthSnapshots((prev) => {
      const existing = prev.find((s) => s.date === today);
      if (existing) return prev.map((s) => (s.date === today ? { date: today, value } : s));
      return [...prev, { date: today, value }];
    });
  }, [user, accounts]);

  return (
    <DataContext.Provider
      value={{
        accounts, accountGroups, visibleAccountGroups, transactionGroups, rawTransactions, linkedItems, brokenItems,
        isLoading, isUsingMockData, error,
        refreshAccounts, refreshTransactions, connectBank, disconnectBank,
        sendChatMessage,
        refreshAllUserData,
        // Computed
        cashFlowMonths, expensesByCategory, incomeBySource,
        monthlyData, flatTransactions, transactionStats,
        recurringTransactions,
        budgetSections, budgetTargets, updateBudgetTarget,
        insights, notifications,
        holdingGroups, benchmarks, refreshInvestments,
        // Goals
        goals, addGoal, updateGoal, deleteGoal,
        // Settings
        userSettings, updateUserSetting,
        // Transaction edits
        transactionEdits, updateTransaction,
        // Net worth timeline
        netWorthTimeline,
        // Phase 1
        transferIds, markAsTransfer,
        hiddenAccountIds, toggleAccountHidden,
        getDisplayCategory, renameCategory,
        rules, addRule, deleteRule,
        splits, updateSplit, deleteSplit,
        // Phase 4
        manualAccounts, addManualAccount, updateManualAccount, deleteManualAccount,
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
