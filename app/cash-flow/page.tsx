"use client";

import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, ChevronRight, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Card, PillToggle, SectionHeader, EmptyState } from "@/components/ui";
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
} from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";

type TimePeriod = "Monthly" | "Quarterly" | "Yearly";
type ViewType = "Bar Chart" | "Flow Diagram";
type BreakdownView = "Category" | "Group" | "Merchant";

export default function CashFlowPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Monthly");
  const [year, setYear] = useState(2026);
  const [viewType, setViewType] = useState<ViewType>("Bar Chart");
  const [incomeView, setIncomeView] = useState<BreakdownView>("Category");
  const [expenseView, setExpenseView] = useState<BreakdownView>("Category");

  const { cashFlowMonths, expensesByCategory: expenseBreakdown, incomeBySource: incomeBreakdown, rawTransactions, transferIds, isUsingMockData } = useData();
  const hasNoData = !isUsingMockData && rawTransactions.length === 0;

  // Build merchant/group breakdowns from raw transactions — excluding transfers
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthTxs = useMemo(
    () => rawTransactions.filter((t) => t.date.startsWith(currentMonthKey) && !transferIds.has(t.transaction_id)),
    [rawTransactions, currentMonthKey, transferIds]
  );

  // Group (top-level Plaid category) breakdown
  const expensesByGroup = useMemo(() => {
    const byGroup: Record<string, number> = {};
    for (const tx of currentMonthTxs) {
      if (tx.amount <= 0) continue;
      const g = tx.category?.[0] || "Other";
      byGroup[g] = (byGroup[g] || 0) + tx.amount;
    }
    const total = Object.values(byGroup).reduce((s, v) => s + v, 0) || 1;
    const colors = ["#E03131", "#E5633A", "#7C3AED", "#4D8FDB", "#2B8A3E", "#0891B2", "#D97706", "#BE185D"];
    return Object.entries(byGroup)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount], i) => ({
        id: cat, category: cat, emoji: "📊", amount, percentage: (amount / total) * 100,
        color: colors[i % colors.length],
      }));
  }, [currentMonthTxs]);

  // Merchant breakdown
  const expensesByMerchant = useMemo(() => {
    const byMerchant: Record<string, number> = {};
    for (const tx of currentMonthTxs) {
      if (tx.amount <= 0) continue;
      const m = tx.merchant_name || tx.name || "Unknown";
      byMerchant[m] = (byMerchant[m] || 0) + tx.amount;
    }
    const total = Object.values(byMerchant).reduce((s, v) => s + v, 0) || 1;
    const colors = ["#E03131", "#E5633A", "#7C3AED", "#4D8FDB", "#2B8A3E", "#0891B2", "#D97706", "#BE185D"];
    return Object.entries(byMerchant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([merchant, amount], i) => ({
        id: merchant, category: merchant, emoji: "🛒", amount, percentage: (amount / total) * 100,
        color: colors[i % colors.length],
      }));
  }, [currentMonthTxs]);

  // Same for income by group/merchant
  const incomeByGroup = useMemo(() => {
    const byGroup: Record<string, number> = {};
    for (const tx of currentMonthTxs) {
      if (tx.amount >= 0) continue;
      const g = tx.category?.[0] || "Income";
      byGroup[g] = (byGroup[g] || 0) + Math.abs(tx.amount);
    }
    const total = Object.values(byGroup).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(byGroup)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount], i) => ({
        id: cat, category: cat, emoji: "💰", amount, percentage: (amount / total) * 100,
        color: ["#2B8A3E", "#5C9E6B", "#0891B2"][i % 3],
      }));
  }, [currentMonthTxs]);

  const incomeByMerchant = useMemo(() => {
    const byMerchant: Record<string, number> = {};
    for (const tx of currentMonthTxs) {
      if (tx.amount >= 0) continue;
      const m = tx.merchant_name || tx.name || "Unknown";
      byMerchant[m] = (byMerchant[m] || 0) + Math.abs(tx.amount);
    }
    const total = Object.values(byMerchant).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(byMerchant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([m, amount], i) => ({
        id: m, category: m, emoji: "💵", amount, percentage: (amount / total) * 100,
        color: ["#2B8A3E", "#5C9E6B", "#0891B2"][i % 3],
      }));
  }, [currentMonthTxs]);

  // Pick the breakdown based on toggle
  const displayedExpenses = expenseView === "Category" ? expenseBreakdown
    : expenseView === "Group" ? expensesByGroup : expensesByMerchant;
  const displayedIncomes = incomeView === "Category" ? incomeBreakdown
    : incomeView === "Group" ? incomeByGroup : incomeByMerchant;

  // Calculate summary stats from cash flow data
  const totalIncome = cashFlowMonths.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = cashFlowMonths.reduce((sum, m) => sum + m.expenses, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Prepare chart data with net savings
  const chartData = cashFlowMonths.map((m) => ({
    ...m,
    netSavings: m.income - m.expenses,
  }));

  // Sort expense breakdown by amount descending
  const sortedExpenses = [...displayedExpenses].sort((a, b) => b.amount - a.amount);
  const sortedIncomes = [...displayedIncomes].sort((a, b) => b.amount - a.amount);

  const summaryCards = [
    {
      label: "Income",
      amount: totalIncome,
      color: "text-flourish-green",
    },
    {
      label: "Expenses",
      amount: totalExpenses,
      color: "text-flourish-red",
    },
    {
      label: "Total Savings",
      amount: totalSavings,
      color: totalSavings >= 0 ? "text-flourish-green" : "text-flourish-red",
    },
    {
      label: "Savings Rate",
      amount: savingsRate,
      isPercent: true,
      color: savingsRate >= 0 ? "text-flourish-green" : "text-flourish-red",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-display font-bold text-flourish-text">
          Cash Flow
        </h1>
        <div className="flex items-center gap-3">
          <PillToggle
            options={["Monthly", "Quarterly", "Yearly"]}
            value={timePeriod}
            onChange={(v) => setTimePeriod(v as TimePeriod)}
            size="sm"
          />
          <button className="inline-flex items-center gap-2 rounded-lg bg-flourish-bg px-3 py-1.5 text-sm transition-colors hover:bg-flourish-tertiary/10">
            <SlidersHorizontal className="h-4 w-4 text-flourish-secondary" />
            <span className="text-flourish-secondary">Filter</span>
          </button>
        </div>
      </div>

      {hasNoData && (
        <Card className="p-0">
          <EmptyState
            icon={<TrendingUp className="w-6 h-6" />}
            title="Not enough transaction data yet"
            subtitle="Cash-flow trends appear once transactions start syncing. Connect an account to see income vs. spending over time."
            action={{ label: 'Connect an account', href: '/accounts' }}
          />
        </Card>
      )}

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setYear(year - 1)}
          className="rounded-lg p-2 transition-colors hover:bg-flourish-bg"
        >
          <ChevronLeft className="h-5 w-5 text-flourish-text" />
        </button>
        <span className="w-20 text-center text-lg font-semibold text-flourish-text">
          {year}
        </span>
        <button
          onClick={() => setYear(year + 1)}
          className="rounded-lg p-2 transition-colors hover:bg-flourish-bg"
        >
          <ChevronRight className="h-5 w-5 text-flourish-text" />
        </button>
      </div>

      {/* Chart */}
      <Card className="animate-slide-up">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E5E5"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#736E66"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#736E66"
                style={{ fontSize: "12px" }}
                tickFormatter={(v) => formatCurrencyShort(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: "#22201D" }}
              />
              <Bar
                dataKey="income"
                fill="#BFE6C8"
                radius={[4, 4, 0, 0]}
                name="Income"
              />
              <Bar
                dataKey="expenses"
                fill="#F2CCCC"
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="netSavings"
                stroke="#E5633A"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Net Savings"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => (
          <Card
            key={card.label}
            className="animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-flourish-tertiary">
                {card.label}
              </p>
              <p
                className={cn(
                  "font-display text-money-xl",
                  card.color
                )}
              >
                {card.isPercent
                  ? `${(card.amount as number).toFixed(1)}%`
                  : formatCurrencyShort(card.amount as number)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-flourish-text">Breakdown</h2>
        <PillToggle
          options={["Bar Chart", "Flow Diagram"]}
          value={viewType}
          onChange={(v) => setViewType(v as ViewType)}
          size="sm"
        />
      </div>

      {/* Flow Diagram */}
      {viewType === "Flow Diagram" && (
        <Card className="animate-slide-up p-8">
          <div className="space-y-6">
            <p className="text-sm text-flourish-secondary">Where your money came from and where it went this month</p>

            <div className="flex items-stretch gap-6">
              {/* Income column */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-flourish-green mb-3">
                  Income · {formatCurrency(totalIncome)}
                </div>
                {sortedIncomes.map((item) => (
                  <div key={item.id} className="bg-emerald-50 p-3 rounded-xl border-l-4 border-flourish-green">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-flourish-text truncate">
                        {item.emoji} {item.category}
                      </span>
                      <span className="text-sm font-bold text-flourish-green tabular-nums">
                        +{formatCurrencyShort(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flow Arrow */}
              <div className="flex flex-col items-center justify-center px-4">
                <div className="w-12 h-12 rounded-full bg-flourish-orange/10 flex items-center justify-center mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-flourish-orange">
                    <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs text-flourish-muted uppercase tracking-wider mb-1">Net</p>
                  <p className={cn('font-display text-lg font-bold', totalSavings >= 0 ? 'text-flourish-green' : 'text-flourish-red')}>
                    {totalSavings >= 0 ? '+' : ''}{formatCurrencyShort(totalSavings)}
                  </p>
                </div>
              </div>

              {/* Expenses column */}
              <div className="flex-1 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-flourish-red mb-3">
                  Expenses · {formatCurrency(totalExpenses)}
                </div>
                {sortedExpenses.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border-l-4"
                    style={{
                      backgroundColor: item.color + '15',
                      borderLeftColor: item.color,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-flourish-text truncate">
                        {item.emoji} {item.category}
                      </span>
                      <span className="text-sm font-bold text-flourish-text tabular-nums">
                        -{formatCurrencyShort(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {viewType === "Bar Chart" && <>
      {/* Income Breakdown */}
      <Card className="animate-slide-up">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Income Breakdown" />
            <PillToggle
              options={["Category", "Group", "Merchant"]}
              value={incomeView}
              onChange={(v) => setIncomeView(v as BreakdownView)}
              size="sm"
            />
          </div>
          <div className="space-y-3">
            {sortedIncomes.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-sm font-medium text-flourish-text">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-flourish-text">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex h-6 w-full items-center gap-2 rounded-full bg-emerald-50">
                  <div
                    className="h-full rounded-full bg-flourish-green transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                  <span className="ml-auto mr-2 text-xs text-emerald-700 font-medium">
                    {formatPercent(item.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Expense Breakdown */}
      <Card className="animate-slide-up">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Expense Breakdown" />
            <PillToggle
              options={["Category", "Group", "Merchant"]}
              value={expenseView}
              onChange={(v) => setExpenseView(v as BreakdownView)}
              size="sm"
            />
          </div>
          <div className="space-y-3">
            {sortedExpenses.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-sm font-medium text-flourish-text">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-flourish-text">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex h-6 w-full items-center gap-2 rounded-full bg-red-50">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="ml-auto mr-2 text-xs font-medium" style={{ color: item.color }}>
                    {formatPercent(item.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      </>}
    </div>
  );
}
