"use client";

import React, { useState } from "react";
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
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Card, PillToggle, SectionHeader } from "@/components/ui";
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
} from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";

type TimePeriod = "Monthly" | "Quarterly" | "Yearly";
type ViewType = "Bar Chart" | "Sankey Diagram";
type BreakdownView = "Category" | "Group" | "Merchant";

export default function CashFlowPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Monthly");
  const [year, setYear] = useState(2026);
  const [viewType, setViewType] = useState<ViewType>("Bar Chart");
  const [incomeView, setIncomeView] = useState<BreakdownView>("Category");
  const [expenseView, setExpenseView] = useState<BreakdownView>("Category");

  const { cashFlowMonths, expensesByCategory: expenseBreakdown, incomeBySource: incomeBreakdown } = useData();

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
  const sortedExpenses = [...expenseBreakdown].sort((a, b) => b.amount - a.amount);
  const sortedIncomes = [...incomeBreakdown].sort((a, b) => b.amount - a.amount);

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
          options={["Bar Chart", "Sankey Diagram"]}
          value={viewType}
          onChange={(v) => setViewType(v as ViewType)}
          size="sm"
        />
      </div>

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
    </div>
  );
}
