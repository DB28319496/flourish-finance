'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown, AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Card, PillToggle, Badge, Dropdown } from '@/components/ui';
import { useData } from '@/lib/data-context';
import { formatCurrency, formatPercent } from '@/lib/mock-data';
import { cn, getMerchantColor } from '@/lib/utils';

type ViewType = 'holdings' | 'allocation' | 'insights';
type Timeframe = '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y';

const SECTOR_COLORS = [
  '#E5633A', '#4D8FDB', '#2B8A3E', '#7C3AED', '#E03131',
  '#0891B2', '#D97706', '#BE185D', '#6D28D9', '#059669',
];

export default function InvestmentsPage() {
  const { holdingGroups, benchmarks, isUsingMockData, accountGroups, connectBank } = useData();

  // Detect investment accounts that exist but have no holdings data
  const investmentAccountsCount = accountGroups
    .filter((g) => g.type === 'investments')
    .reduce((s, g) => s + g.accounts.length, 0);
  const hasInvestmentAccountsButNoHoldings = !isUsingMockData && investmentAccountsCount > 0 && holdingGroups.length === 0;

  const [viewType, setViewType] = useState<ViewType>('holdings');
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [account, setAccount] = useState('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(holdingGroups.map((g) => [g.id, true]))
  );

  const timeframes: Timeframe[] = ['1W', '1M', '3M', '6M', 'YTD', '1Y', '5Y'];

  // Flatten all holdings
  const allHoldings = useMemo(() => {
    const filtered = account === 'all'
      ? holdingGroups
      : holdingGroups.filter((g) => g.id === account);
    return filtered.flatMap((g) => g.holdings);
  }, [holdingGroups, account]);

  // Portfolio value = sum of holdings, or fallback to investment account balances
  const totalPortfolioValue = useMemo(() => {
    if (allHoldings.length > 0) {
      return allHoldings.reduce((sum, h) => sum + h.value, 0);
    }
    // Fall back to summing investment account balances when holdings aren't available
    return accountGroups
      .filter((g) => g.type === 'investments')
      .reduce((s, g) => s + g.accounts.reduce((ss, a) => ss + a.balance, 0), 0);
  }, [allHoldings, accountGroups]);

  const totalCostBasis = useMemo(
    () => allHoldings.reduce((sum, h) => sum + h.costBasis, 0),
    [allHoldings]
  );

  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalReturn = totalCostBasis > 0 ? ((totalGainLoss / totalCostBasis) * 100) : 0;

  // Portfolio movers — top gainers and losers by value change
  const movers = useMemo(() => {
    const withGain = allHoldings
      .filter((h) => h.costBasis > 0)
      .map((h) => ({
        ...h,
        gain: h.value - h.costBasis,
        gainPct: ((h.value - h.costBasis) / h.costBasis) * 100,
      }))
      .sort((a, b) => b.gainPct - a.gainPct);

    return {
      gainers: withGain.filter((h) => h.gainPct > 0).slice(0, 3),
      losers: withGain.filter((h) => h.gainPct < 0).sort((a, b) => a.gainPct - b.gainPct).slice(0, 3),
    };
  }, [allHoldings]);

  // Allocation data for pie chart
  const allocationData = useMemo(() => {
    const totalValue = allHoldings.reduce((s, h) => s + h.value, 0) || 1;
    return allHoldings
      .sort((a, b) => b.value - a.value)
      .map((h, i) => ({
        name: h.ticker,
        value: Math.round(h.value * 100) / 100,
        pct: Math.round((h.value / totalValue) * 1000) / 10,
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }));
  }, [allHoldings]);

  // Concentration risk warnings
  const riskWarnings = useMemo(() => {
    const warnings: string[] = [];
    const totalVal = allHoldings.reduce((s, h) => s + h.value, 0) || 1;
    for (const h of allHoldings) {
      const pct = (h.value / totalVal) * 100;
      if (pct > 25) {
        warnings.push(`${h.ticker} is ${pct.toFixed(1)}% of your portfolio — consider diversifying`);
      }
    }
    return warnings;
  }, [allHoldings]);

  // Performance chart data (mock, as we'd need historical data)
  const performanceChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const base = totalPortfolioValue * 0.9;
    return months.map((date, i) => ({
      date,
      portfolio: Math.round(base + (totalPortfolioValue - base) * (i / 5)),
      benchmark: Math.round(base * 0.98 + (base * 1.04 - base * 0.98) * (i / 5)),
    }));
  }, [totalPortfolioValue]);

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const accountOptions = [
    { value: 'all', label: 'All Accounts' },
    ...holdingGroups.map((g) => ({ value: g.id, label: g.accountName })),
  ];

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-flourish-text">Investments</h1>
            <p className="mt-1 text-flourish-secondary">
              {isUsingMockData ? 'Demo portfolio data' : 'Live portfolio data from your connected accounts'}
            </p>
          </div>
          <Dropdown
            value={account}
            onChange={setAccount}
            options={accountOptions}
          />
        </div>

        {/* Empty state: investment accounts exist but holdings endpoint fails */}
        {hasInvestmentAccountsButNoHoldings && (
          <Card className="p-8 mb-8 border-l-4 border-amber-400">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-flourish-text mb-1">
                  Investment data needs additional access
                </h3>
                <p className="font-body text-sm text-flourish-muted mb-4">
                  We can see your {investmentAccountsCount} investment {investmentAccountsCount === 1 ? 'account' : 'accounts'} and their balances, but detailed holdings data (individual stocks, ETFs, cost basis) requires reconnecting. Your iOS app connected these with only the Transactions product — reconnecting through the web adds Investments support.
                </p>
                <button
                  onClick={() => connectBank()}
                  className="px-4 py-2 bg-flourish-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Reconnect investment accounts
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Portfolio Value Card */}
        <Card className="p-8 mb-8 animate-slide-up bg-gradient-to-br from-flourish-orange/5 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-body text-sm text-flourish-muted mb-1">Total Portfolio Value</p>
              <p className="font-display text-4xl font-bold text-flourish-text">{formatCurrency(totalPortfolioValue)}</p>
              <div className="flex items-center gap-2 mt-2">
                {totalGainLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={cn('text-sm font-semibold', totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} ({totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%)
                </span>
                <span className="text-xs text-flourish-muted">all time</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body text-sm text-flourish-muted mb-1">Cost Basis</p>
              <p className="font-display text-xl font-bold text-flourish-text">{formatCurrency(totalCostBasis)}</p>
            </div>
          </div>
        </Card>

        {/* View Type Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-8 border-b border-flourish-border">
            {(['holdings', 'allocation', 'insights'] as ViewType[]).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={cn(
                  'font-body text-sm font-medium pb-3 transition-colors capitalize',
                  viewType === type
                    ? 'text-flourish-orange border-b-2 border-flourish-orange'
                    : 'text-flourish-muted hover:text-flourish-text'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Timeframe Pills */}
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
                  timeframe === tf
                    ? 'bg-flourish-orange text-white'
                    : 'bg-flourish-hover text-flourish-text hover:bg-opacity-80'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Holdings View */}
        {viewType === 'holdings' && (
          <div className="space-y-4">
            {/* Benchmark Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {benchmarks.map((bm) => (
                <Card key={bm.id} className={cn('p-5 border-l-4')} style={{ borderLeftColor: bm.color }}>
                  <p className="font-body text-xs text-flourish-muted mb-1">{bm.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-xl font-bold text-flourish-text">
                      {bm.performance3M >= 0 ? '+' : ''}{formatPercent(bm.performance3M)}
                    </p>
                    {bm.performance3M >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="font-body text-[10px] text-flourish-muted mt-1 uppercase tracking-wider">Past 3 months</p>
                </Card>
              ))}
            </div>

            {/* Performance Chart */}
            <Card className="p-6 mb-6">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">Performance vs Benchmark</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={performanceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="portfolio" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} name="Your Portfolio" />
                  <Line type="monotone" dataKey="benchmark" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="S&P 500" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Holdings by Account */}
            {holdingGroups.map((group) => (
              <div key={group.id}>
                <button
                  onClick={() => toggleAccount(group.id)}
                  className="w-full flex items-center justify-between p-4 bg-flourish-hover rounded-flourish-lg mb-2 hover:bg-opacity-80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={cn('w-5 h-5 text-flourish-text transition-transform', !expandedAccounts[group.id] && '-rotate-90')} />
                    <p className="font-display font-bold text-flourish-text">{group.accountName}</p>
                  </div>
                  <p className="font-display font-bold text-flourish-text">
                    {formatCurrency(group.holdings.reduce((s, h) => s + h.value, 0))}
                  </p>
                </button>

                {expandedAccounts[group.id] && (
                  <Card className="p-0 overflow-hidden mb-4">
                    <div className="divide-y divide-flourish-border">
                      {group.holdings.map((holding) => {
                        const gain = holding.value - holding.costBasis;
                        const gainPct = holding.costBasis > 0 ? (gain / holding.costBasis) * 100 : 0;
                        return (
                          <div key={holding.id} className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: getMerchantColor(holding.ticker) }}>
                                <span className="text-white font-bold text-xs">{holding.ticker.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-display font-bold text-flourish-text">{holding.ticker}</p>
                                <p className="font-body text-sm text-flourish-muted">{holding.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8 text-right">
                              <div className="min-w-[100px]">
                                <p className="font-body text-xs text-flourish-muted">{holding.quantity.toFixed(2)} shares</p>
                                <p className="font-body text-xs text-flourish-muted">@ {formatCurrency(holding.price)}</p>
                              </div>
                              <div className="min-w-[100px]">
                                <p className="font-display font-bold text-flourish-text">{formatCurrency(holding.value)}</p>
                                <p className="font-body text-xs text-flourish-muted">{formatPercent(holding.weight)} of acct</p>
                              </div>
                              <div className="min-w-[80px]">
                                <Badge variant={gain >= 0 ? 'success' : 'danger'} className="flex items-center gap-1 justify-end">
                                  {gain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Allocation View */}
        {viewType === 'allocation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">Asset Allocation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={60}
                    paddingAngle={2}
                    label={({ name, pct }) => `${name} ${pct}%`}
                  >
                    {allocationData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Allocation Table */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">Holdings Breakdown</h3>
              <div className="space-y-3">
                {allocationData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-body text-sm font-medium text-flourish-text flex-1">{item.name}</span>
                    <span className="font-body text-sm text-flourish-muted">{formatCurrency(item.value)}</span>
                    <span className="font-display text-sm font-bold text-flourish-text w-16 text-right">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Insights View (Perplexity Finance style) */}
        {viewType === 'insights' && (
          <div className="space-y-6">
            {/* Portfolio Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-display text-lg font-bold text-flourish-text">Top Gainers</h3>
                </div>
                <div className="space-y-3">
                  {movers.gainers.length > 0 ? movers.gainers.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-100">
                          <span className="text-emerald-700 font-bold text-xs">{h.ticker.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-display font-bold text-flourish-text text-sm">{h.ticker}</p>
                          <p className="font-body text-xs text-flourish-muted">{h.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-green-600">+{formatCurrency(h.gain)}</p>
                        <p className="font-body text-xs text-green-600">+{h.gainPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-flourish-muted">No gainers to show</p>
                  )}
                </div>
              </Card>

              {/* Top Losers */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="font-display text-lg font-bold text-flourish-text">Top Losers</h3>
                </div>
                <div className="space-y-3">
                  {movers.losers.length > 0 ? movers.losers.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-100">
                          <span className="text-red-700 font-bold text-xs">{h.ticker.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-display font-bold text-flourish-text text-sm">{h.ticker}</p>
                          <p className="font-body text-xs text-flourish-muted">{h.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-red-600">{formatCurrency(h.gain)}</p>
                        <p className="font-body text-xs text-red-600">{h.gainPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-flourish-muted">No losers to show</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Concentration Risk */}
            {riskWarnings.length > 0 && (
              <Card className="p-6 border-l-4 border-amber-400">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-display text-lg font-bold text-flourish-text">Concentration Risk</h3>
                </div>
                <div className="space-y-2">
                  {riskWarnings.map((warning, idx) => (
                    <p key={idx} className="font-body text-sm text-flourish-muted">{warning}</p>
                  ))}
                </div>
              </Card>
            )}

            {/* Portfolio Summary */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">Portfolio Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase tracking-wider mb-1">Holdings</p>
                  <p className="font-display text-2xl font-bold text-flourish-text">{allHoldings.length}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase tracking-wider mb-1">Accounts</p>
                  <p className="font-display text-2xl font-bold text-flourish-text">{holdingGroups.length}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase tracking-wider mb-1">Total Value</p>
                  <p className="font-display text-2xl font-bold text-flourish-text">{formatCurrency(totalPortfolioValue)}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-flourish-muted uppercase tracking-wider mb-1">Total Return</p>
                  <p className={cn('font-display text-2xl font-bold', totalReturn >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Largest Holdings */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold text-flourish-text mb-4">Largest Holdings</h3>
              <div className="space-y-3">
                {allHoldings
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
                  .map((h) => {
                    const pct = totalPortfolioValue > 0 ? (h.value / totalPortfolioValue) * 100 : 0;
                    return (
                      <div key={h.id} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: getMerchantColor(h.ticker) }}>
                          <span className="text-white font-bold text-xs">{h.ticker.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-display text-sm font-bold text-flourish-text">{h.ticker} — {h.name}</p>
                            <p className="font-display text-sm font-bold text-flourish-text">{formatCurrency(h.value)}</p>
                          </div>
                          <div className="h-2 bg-flourish-hover rounded-full overflow-hidden">
                            <div
                              className="h-full bg-flourish-orange rounded-full transition-all"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <p className="font-body text-xs text-flourish-muted mt-1">{pct.toFixed(1)}% of portfolio</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
