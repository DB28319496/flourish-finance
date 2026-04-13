'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Sparkles, CreditCard, Wallet, Target, Calendar,
} from 'lucide-react';
import { Card, Badge, Skeleton, SkeletonCard } from '@/components/ui';
import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { cn, getMerchantColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    accounts,
    visibleAccountGroups: accountGroups,
    transactionGroups,
    netWorthTimeline,
    expensesByCategory,
    monthlyData,
    recurringTransactions,
    insights,
    goals,
    holdingGroups,
    isUsingMockData,
    isLoading,
  } = useData();

  if (isLoading && !isUsingMockData) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard className="h-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2 h-80" />
          <SkeletonCard className="h-80" />
        </div>
      </div>
    );
  }

  // Calculations
  const totalAssets = accountGroups
    .filter((g) => g.type !== 'creditCards' && g.type !== 'loans')
    .reduce((s, g) => s + g.accounts.reduce((ss, a) => ss + a.balance, 0), 0);
  const totalLiabilities = accountGroups
    .filter((g) => g.type === 'creditCards' || g.type === 'loans')
    .reduce((s, g) => s + g.accounts.reduce((ss, a) => ss + a.balance, 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Month-over-month change
  const monthOverMonth = monthlyData.length >= 2
    ? monthlyData[monthlyData.length - 1].income - monthlyData[monthlyData.length - 1].expenses -
      (monthlyData[monthlyData.length - 2].income - monthlyData[monthlyData.length - 2].expenses)
    : 0;

  // Upcoming bills (next 7 days)
  const upcomingBills = recurringTransactions.expenses
    .filter((e) => e.status === 'upcoming' && e.daysUntil <= 14)
    .slice(0, 4);

  // Recent transactions (top 5)
  const recentTransactions = transactionGroups
    .flatMap((g) => g.transactions)
    .slice(0, 5);

  // Top spending categories
  const topCategories = expensesByCategory.slice(0, 5);

  // Portfolio value
  const portfolioValue = holdingGroups
    .flatMap((g) => g.holdings)
    .reduce((s, h) => s + h.value, 0);

  // Goals progress
  const topGoals = goals.slice(0, 3);

  // Top insights
  const topInsights = insights.slice(0, 2);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-flourish-text">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-flourish-secondary">
          {isUsingMockData
            ? 'Viewing demo data — sign in to see your real finances'
            : "Here's your financial overview"}
        </p>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="p-5 animate-slide-up cursor-pointer" onClick={() => router.push('/accounts')}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-flourish-muted uppercase tracking-wider">Net Worth</p>
            <Wallet className="w-4 h-4 text-flourish-muted" />
          </div>
          <p className="font-display text-2xl font-bold text-flourish-text tabular-nums">{formatCurrency(netWorth)}</p>
          <div className="flex items-center gap-1 mt-1">
            {monthOverMonth >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
            )}
            <span className={cn('text-xs font-semibold', monthOverMonth >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(Math.abs(monthOverMonth))} this month
            </span>
          </div>
        </Card>

        <Card hover className="p-5 animate-slide-up stagger-1 cursor-pointer" onClick={() => router.push('/accounts')}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-flourish-muted uppercase tracking-wider">Assets</p>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-display text-2xl font-bold text-flourish-text tabular-nums">{formatCurrencyShort(totalAssets)}</p>
          <p className="text-xs text-flourish-muted mt-1">
            {accountGroups.filter((g) => g.type !== 'creditCards' && g.type !== 'loans').reduce((s, g) => s + g.accounts.length, 0)} accounts
          </p>
        </Card>

        <Card hover className="p-5 animate-slide-up stagger-2 cursor-pointer" onClick={() => router.push('/accounts')}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-flourish-muted uppercase tracking-wider">Liabilities</p>
            <CreditCard className="w-4 h-4 text-red-500" />
          </div>
          <p className="font-display text-2xl font-bold text-flourish-text tabular-nums">{formatCurrencyShort(totalLiabilities)}</p>
          <p className="text-xs text-flourish-muted mt-1">
            {accountGroups.filter((g) => g.type === 'creditCards' || g.type === 'loans').reduce((s, g) => s + g.accounts.length, 0)} accounts
          </p>
        </Card>

        <Card hover className="p-5 animate-slide-up stagger-3 cursor-pointer" onClick={() => router.push('/investments')}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-xs text-flourish-muted uppercase tracking-wider">Investments</p>
            <TrendingUp className="w-4 h-4 text-flourish-orange" />
          </div>
          <p className="font-display text-2xl font-bold text-flourish-text tabular-nums">{formatCurrencyShort(portfolioValue)}</p>
          <p className="text-xs text-flourish-muted mt-1">
            {holdingGroups.reduce((s, g) => s + g.holdings.length, 0)} holdings
          </p>
        </Card>
      </div>

      {/* Net Worth Chart */}
      <Card className="p-6 animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-body text-xs text-flourish-muted uppercase tracking-wider mb-1">Net Worth Trend</p>
            <p className="font-display text-3xl font-bold text-flourish-text">{formatCurrency(netWorth)}</p>
          </div>
          <Link href="/accounts" className="text-sm font-medium text-flourish-orange hover:underline">
            View all accounts →
          </Link>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthTimeline} margin={{ top: 10, right: 12, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5633A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#E5633A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--flourish-tertiary)" style={{ fontSize: '11px' }} />
              <YAxis
                stroke="var(--flourish-tertiary)"
                style={{ fontSize: '11px' }}
                width={50}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'Net Worth']}
              />
              <Area type="monotone" dataKey="value" stroke="#E5633A" strokeWidth={2} fill="url(#netWorthGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upcoming Bills + Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Bills */}
          <Card className="p-6 animate-slide-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-flourish-muted" />
                <h3 className="font-display text-lg font-bold text-flourish-text">Upcoming Bills</h3>
              </div>
              <Link href="/recurring" className="text-sm font-medium text-flourish-orange hover:underline">
                See all →
              </Link>
            </div>
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-flourish-muted text-center py-4">No upcoming bills in the next two weeks</p>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map((bill, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(`/transactions?merchant=${encodeURIComponent(bill.merchant)}`)}
                    className="w-full flex items-center justify-between p-3 bg-[#fdf8f4] rounded-xl hover:bg-[#f0e8e0] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{bill.emoji}</div>
                      <div>
                        <p className="font-medium text-flourish-dark text-sm">{bill.merchant}</p>
                        <p className="text-xs text-flourish-muted">
                          {bill.daysUntil === 0 ? 'Due today' : `Due in ${bill.daysUntil} day${bill.daysUntil !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-flourish-dark">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs text-flourish-muted">{bill.nextDate}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Transactions */}
          <Card className="p-6 animate-slide-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-flourish-text">Recent Transactions</h3>
              <Link href="/transactions" className="text-sm font-medium text-flourish-orange hover:underline">
                See all →
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-flourish-muted text-center py-4">No recent transactions</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => router.push(`/transactions?merchant=${encodeURIComponent(tx.merchantName)}`)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#fdf8f4] rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: getMerchantColor(tx.merchantName) + '20' }}
                      >
                        {tx.category.emoji}
                      </div>
                      <div>
                        <p className="font-medium text-flourish-dark text-sm">{tx.merchantName}</p>
                        <p className="text-xs text-flourish-muted">{tx.category.name}</p>
                      </div>
                    </div>
                    <p className="font-display font-bold text-flourish-dark">-{formatCurrency(tx.amount)}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Goals + Insights + Top Spending */}
        <div className="space-y-6">
          {/* Top Spending */}
          <Card className="p-6 animate-slide-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-flourish-text">Top Spending</h3>
              <Link href="/cash-flow" className="text-sm font-medium text-flourish-orange hover:underline">
                Details →
              </Link>
            </div>
            {topCategories.length === 0 ? (
              <p className="text-sm text-flourish-muted text-center py-4">No spending this month yet</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map((cat) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-flourish-dark flex items-center gap-1.5">
                        <span>{cat.emoji}</span>
                        {cat.category}
                      </span>
                      <span className="text-sm font-semibold text-flourish-dark">{formatCurrencyShort(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-[#e8ddd4] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Goals */}
          {topGoals.length > 0 && (
            <Card className="p-6 animate-slide-up stagger-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-flourish-muted" />
                  <h3 className="font-display text-lg font-bold text-flourish-text">Goals</h3>
                </div>
                <Link href="/goals" className="text-sm font-medium text-flourish-orange hover:underline">
                  See all →
                </Link>
              </div>
              <div className="space-y-3">
                {topGoals.map((goal) => {
                  const pct = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-flourish-dark flex items-center gap-1.5">
                          <span>{goal.icon}</span>
                          {goal.name}
                        </span>
                        <span className="text-xs text-flourish-muted">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#e8ddd4] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <p className="text-xs text-flourish-muted mt-1">
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* AI Insights */}
          {topInsights.length > 0 && (
            <Card className="p-6 animate-slide-up stagger-7 bg-gradient-to-br from-flourish-orange/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-flourish-orange" />
                  <h3 className="font-display text-lg font-bold text-flourish-text">Smart Insights</h3>
                </div>
                <Link href="/advice" className="text-sm font-medium text-flourish-orange hover:underline">
                  See all →
                </Link>
              </div>
              <div className="space-y-3">
                {topInsights.map((insight) => (
                  <div key={insight.id} className="p-3 bg-white rounded-xl border border-flourish-border">
                    <p className="text-sm font-semibold text-flourish-dark mb-1">{insight.title}</p>
                    <p className="text-xs text-flourish-muted line-clamp-2">{insight.description}</p>
                    <p className="text-xs font-semibold mt-2" style={{ color: insight.color }}>
                      {insight.impact}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
