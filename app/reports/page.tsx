'use client';

import { useState } from 'react';
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

  const { monthlyData, flatTransactions, transactionStats } = useData();

  // Compute summary from real data
  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpensesVal = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const netIncome = totalIncome - totalExpensesVal;
  const savingsRateVal = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

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
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'daily', label: 'Daily' }
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
              data={monthlyData}
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="flex items-center gap-2 px-4 py-2 border border-flourish-border rounded-flourish-lg hover:bg-flourish-hover transition-colors font-body text-sm">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-flourish-border rounded-flourish-lg hover:bg-flourish-hover transition-colors font-body text-sm">
            <Settings className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium ml-auto">
            <Save className="w-4 h-4" />
            Save Report
          </button>
        </div>

        {/* Transaction Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transaction List */}
          <div className="lg:col-span-2">
            <Card className="p-6 animate-slide-up stagger-5">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {flatTransactions.slice(0, 8).map((txn, idx) => (
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
