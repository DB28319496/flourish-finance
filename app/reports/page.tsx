'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Settings, Save, BarChart3 } from 'lucide-react';
import { Card, PillToggle, SectionHeader, ProgressBar, Badge, Dropdown } from '@/components/ui';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent
} from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { cn } from '@/lib/utils';

type ReportTab = 'cash-flow' | 'spending' | 'income';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('cash-flow');
  const [grouping, setGrouping] = useState('monthly');
  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { monthlyData, flatTransactions, transactionStats, rawTransactions, transferIds } = useData();

  // Apply date range filter to monthlyData
  const filteredMonthly = useMemo(() => {
    if (dateRange === 'All Time') return monthlyData;
    const months = dateRange === 'Last 3 Months' ? 3 : dateRange === 'Last 6 Months' ? 6 : dateRange === 'Last 12 Months' ? 12 : dateRange === 'YTD' ? new Date().getMonth() + 1 : 6;
    return monthlyData.slice(-months);
  }, [monthlyData, dateRange]);

  // Build yearly aggregation from all transactions
  const yearlyData = useMemo(() => {
    const byYear: Record<string, { income: number; expenses: number }> = {};
    for (const tx of rawTransactions) {
      if (transferIds.has(tx.transaction_id)) continue; // exclude transfers
      const year = tx.date.slice(0, 4);
      if (!byYear[year]) byYear[year] = { income: 0, expenses: 0 };
      if (tx.amount < 0) byYear[year].income += Math.abs(tx.amount);
      else byYear[year].expenses += tx.amount;
    }
    return Object.entries(byYear)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({
        month: year, // reuse 'month' field for chart X axis
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
      }));
  }, [rawTransactions, transferIds]);

  // The chart data depends on grouping
  const chartData = grouping === 'yearly' ? yearlyData : filteredMonthly;

  // YoY comparison: current year vs previous year
  const yoyComparison = useMemo(() => {
    if (yearlyData.length < 2) return null;
    const [prev, curr] = yearlyData.slice(-2);
    const incomeChange = prev.income > 0 ? ((curr.income - prev.income) / prev.income) * 100 : 0;
    const expenseChange = prev.expenses > 0 ? ((curr.expenses - prev.expenses) / prev.expenses) * 100 : 0;
    return { prev, curr, incomeChange, expenseChange };
  }, [yearlyData]);

  // Apply filters to flatTransactions
  const filteredFlat = useMemo(() => {
    let result = flatTransactions;
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    if (!isNaN(min)) result = result.filter((t) => Math.abs(t.amount) >= min);
    if (!isNaN(max)) result = result.filter((t) => Math.abs(t.amount) <= max);
    if (categoryFilter.trim()) {
      const q = categoryFilter.trim().toLowerCase();
      result = result.filter((t) => t.category.toLowerCase().includes(q));
    }
    return result;
  }, [flatTransactions, minAmount, maxAmount, categoryFilter]);

  // Compute summary from filtered data
  const totalIncome = filteredMonthly.reduce((s, m) => s + m.income, 0);
  const totalExpensesVal = filteredMonthly.reduce((s, m) => s + m.expenses, 0);
  const netIncome = totalIncome - totalExpensesVal;
  const savingsRateVal = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  const handleExportCSV = () => {
    const header = 'Date,Merchant,Category,Amount\n';
    const rows = rawTransactions.map((t) =>
      [t.date, `"${(t.merchant_name || t.name).replace(/"/g, '""')}"`, `"${(t.category?.[0] || 'Other').replace(/"/g, '""')}"`, (t.amount > 0 ? -t.amount : Math.abs(t.amount))].join(',')
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flourish-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: 'Total Income',
      value: formatCurrency(totalIncome),
      change: '',
      changeColor: 'text-green-600'
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(totalExpensesVal),
      change: '',
      changeColor: 'text-red-600'
    },
    {
      label: 'Net Income',
      value: formatCurrency(netIncome),
      change: '',
      changeColor: netIncome >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      label: 'Savings Rate',
      value: `${Math.round(savingsRateVal)}%`,
      change: '',
      changeColor: savingsRateVal >= 0 ? 'text-green-600' : 'text-red-600'
    }
  ];

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'cash-flow', label: 'Cash Flow' },
    { id: 'spending', label: 'Spending' },
    { id: 'income', label: 'Income' }
  ];

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-flourish-text mb-6">Reports</h1>

          {/* Tab Navigation */}
          <div className="flex gap-8 border-b border-flourish-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'font-body text-sm font-medium pb-3 transition-colors',
                  activeTab === tab.id
                    ? 'text-flourish-orange border-b-2 border-flourish-orange'
                    : 'text-flourish-muted hover:text-flourish-text'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, idx) => (
            <Card
              key={card.label}
              className={cn(
                'p-6 animate-slide-up',
                `stagger-${idx}`
              )}
            >
              <p className="font-body text-sm text-flourish-muted mb-2">{card.label}</p>
              <p className="font-display text-2xl font-bold text-flourish-text mb-3">
                {card.value}
              </p>
              <p className={`font-body text-sm font-medium ${card.changeColor}`}>
                {card.change}
              </p>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card className="p-8 mb-8 animate-slide-up stagger-4">
          {/* Header with controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SectionHeader>CASH FLOW</SectionHeader>
              <Dropdown
                value={grouping}
                onChange={setGrouping}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' }
                ]}
              />
            </div>
            <button className="p-2 hover:bg-flourish-hover rounded-lg transition-colors">
              <BarChart3 className="w-5 h-5 text-flourish-text" />
            </button>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Year-over-Year Comparison */}
        {grouping === 'yearly' && yoyComparison && (
          <Card className="p-6 mb-6 animate-slide-up">
            <h3 className="font-display text-lg font-bold text-flourish-text mb-4">
              {yoyComparison.curr.month} vs {yoyComparison.prev.month}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-emerald-50/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Income</p>
                <p className="font-display text-2xl font-bold text-flourish-dark">{formatCurrency(yoyComparison.curr.income)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn('text-sm font-semibold', yoyComparison.incomeChange >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {yoyComparison.incomeChange >= 0 ? '+' : ''}{yoyComparison.incomeChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-flourish-muted">vs {formatCurrency(yoyComparison.prev.income)} in {yoyComparison.prev.month}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-800 mb-1">Expenses</p>
                <p className="font-display text-2xl font-bold text-flourish-dark">{formatCurrency(yoyComparison.curr.expenses)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn('text-sm font-semibold', yoyComparison.expenseChange <= 0 ? 'text-green-600' : 'text-red-600')}>
                    {yoyComparison.expenseChange >= 0 ? '+' : ''}{yoyComparison.expenseChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-flourish-muted">vs {formatCurrency(yoyComparison.prev.expenses)} in {yoyComparison.prev.month}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Dropdown
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: 'Last 3 Months', label: 'Last 3 Months' },
              { value: 'Last 6 Months', label: 'Last 6 Months' },
              { value: 'Last 12 Months', label: 'Last 12 Months' },
              { value: 'YTD', label: 'Year to Date' },
              { value: 'All Time', label: 'All Time' },
            ]}
          />
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-flourish-lg transition-colors font-body text-sm',
              filtersOpen
                ? 'bg-flourish-orange text-white border-flourish-orange'
                : 'border-flourish-border hover:bg-flourish-hover'
            )}
          >
            <Settings className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium ml-auto"
          >
            <Save className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <Card className="p-4 mb-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-1">Min Amount</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-flourish-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-1">Max Amount</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="no max"
                  className="w-full px-3 py-2 border border-flourish-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-1">Category contains</label>
                <input
                  type="text"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="e.g. food"
                  className="w-full px-3 py-2 border border-flourish-border rounded-lg text-sm"
                />
              </div>
            </div>
            {(minAmount || maxAmount || categoryFilter) && (
              <button
                onClick={() => { setMinAmount(''); setMaxAmount(''); setCategoryFilter(''); }}
                className="mt-3 text-xs font-medium text-flourish-orange hover:underline"
              >
                Clear all filters
              </button>
            )}
          </Card>
        )}

        {/* Transaction Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction List */}
          <div className="lg:col-span-2">
            <Card className="p-6 animate-slide-up stagger-5">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {filteredFlat.slice(0, 8).map((txn, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 hover:bg-flourish-hover rounded-lg transition-colors border-b border-flourish-border last:border-b-0"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-flourish-hover flex items-center justify-center">
                        <span className="text-sm font-bold text-flourish-text">
                          {txn.merchant.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-flourish-text truncate">
                          {txn.merchant}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          {txn.category}
                        </p>
                      </div>
                    </div>
                    <p className="font-display font-bold text-flourish-text">
                      {formatCurrencyShort(txn.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <Card className="p-6 animate-slide-up stagger-6">
              <div className="space-y-4">
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase mb-1">
                    Total Transactions
                  </p>
                  <p className="font-display text-2xl font-bold text-flourish-text">
                    {transactionStats.totalCount || flatTransactions.length}
                  </p>
                </div>
                <div className="h-px bg-flourish-border" />
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase mb-1">
                    Largest
                  </p>
                  <p className="font-display text-lg font-bold text-flourish-text">
                    {formatCurrency(transactionStats.largest || 0)}
                  </p>
                </div>
                <div className="h-px bg-flourish-border" />
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase mb-1">
                    Average
                  </p>
                  <p className="font-display text-lg font-bold text-flourish-text">
                    {formatCurrency(transactionStats.average || 0)}
                  </p>
                </div>
                <div className="h-px bg-flourish-border" />
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase mb-1">
                    Total Income
                  </p>
                  <p className="font-display text-lg font-bold text-green-600">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="h-px bg-flourish-border" />
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase mb-1">
                    Total Spending
                  </p>
                  <p className="font-display text-lg font-bold text-red-600">
                    {formatCurrency(totalExpensesVal)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
