'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, PillToggle, Badge, Dropdown } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/mock-data';
import { cn, getMerchantColor } from '@/lib/utils';

type ViewType = 'holdings' | 'allocation';
type Timeframe = '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y';

export default function InvestmentsPage() {
  const [viewType, setViewType] = useState<ViewType>('holdings');
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [account, setAccount] = useState('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({
    checking: true,
    savings: true,
    investment: true
  });

  const timeframes: Timeframe[] = ['1W', '1M', '3M', '6M', 'YTD', '1Y', '5Y'];

  const benchmarkCards = [
    {
      label: 'Your Portfolio',
      value: '+12.48%',
      color: 'border-flourish-orange',
      icon: 'up'
    },
    {
      label: 'S&P 500',
      value: '+8.32%',
      color: 'border-blue-500',
      icon: 'up'
    },
    {
      label: 'Nasdaq-100',
      value: '+15.67%',
      color: 'border-green-500',
      icon: 'up'
    },
    {
      label: 'Bond Index',
      value: '-1.45%',
      color: 'border-red-500',
      icon: 'down'
    }
  ];

  const performanceChartData = [
    { date: 'Jan', portfolio: 95000, benchmark: 96000 },
    { date: 'Feb', portfolio: 97500, benchmark: 97200 },
    { date: 'Mar', portfolio: 99200, benchmark: 99800 },
    { date: 'Apr', portfolio: 101500, benchmark: 100400 },
    { date: 'May', portfolio: 103200, benchmark: 102100 },
    { date: 'Jun', portfolio: 106800, benchmark: 104300 }
  ];

  const accounts = [
    {
      id: 'checking',
      name: 'Checking Account',
      value: 15000,
      holdings: [
        { ticker: 'CASH', name: 'USD Cash', value: 15000, weight: 13.5, performance: 0 }
      ]
    },
    {
      id: 'savings',
      name: 'Savings Account',
      value: 25000,
      holdings: [
        { ticker: 'CASH', name: 'USD Cash', value: 25000, weight: 22.5, performance: 0 }
      ]
    },
    {
      id: 'investment',
      name: 'Brokerage Account',
      value: 70999.23,
      holdings: [
        { ticker: 'AAPL', name: 'Apple Inc.', value: 28450.75, weight: 25.6, performance: 18.5 },
        { ticker: 'MSFT', name: 'Microsoft Corp.', value: 21340.50, weight: 19.2, performance: 12.8 },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', value: 14567.89, weight: 13.1, performance: 10.2 },
        { ticker: 'TSLA', name: 'Tesla Inc.', value: 6640.09, weight: 6.0, performance: 28.4 }
      ]
    }
  ];

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const totalPortfolioValue = accounts.reduce((sum, acc) => sum + acc.value, 0);

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-bold text-flourish-text">Investments</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium">
            <Plus className="w-4 h-4" />
            Add holding
          </button>
        </div>

        {/* View Type Tabs */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-8 border-b border-flourish-border">
            {['holdings', 'allocation'].map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type as ViewType)}
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

          <Dropdown
            value={account}
            onChange={setAccount}
            options={[
              { value: 'all', label: 'All Accounts' },
              { value: 'checking', label: 'Checking Account' },
              { value: 'savings', label: 'Savings Account' },
              { value: 'investment', label: 'Brokerage Account' }
            ]}
          />
        </div>

        {/* Timeframe Pills */}
        <div className="flex gap-3 mb-8">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-4 py-2 rounded-full font-body text-sm font-medium transition-colors',
                timeframe === tf
                  ? 'bg-flourish-orange text-white'
                  : 'bg-flourish-hover text-flourish-text hover:bg-opacity-80'
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Benchmark Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {benchmarkCards.map((card, idx) => (
            <Card
              key={card.label}
              className={cn(
                'p-6 border-t-4 animate-slide-up',
                card.color,
                `stagger-${idx}`
              )}
            >
              <p className="font-body text-sm text-flourish-muted mb-2">{card.label}</p>
              <div className="flex items-center gap-2">
                <p className="font-display text-2xl font-bold text-flourish-text">
                  {card.value}
                </p>
                {card.icon === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className="font-body text-xs text-flourish-muted mt-3">PAST 3 MONTHS</p>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        <Card className="p-8 mb-8 animate-slide-up stagger-4">
          <h3 className="font-display text-lg font-bold text-flourish-text mb-6">
            Performance vs Benchmark
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={performanceChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                name="Your Portfolio"
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="S&P 500"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Holdings by Account */}
        <div className="space-y-6">
          {accounts.map((acct) => (
            <div key={acct.id}>
              <button
                onClick={() => toggleAccount(acct.id)}
                className="w-full flex items-center justify-between p-4 bg-flourish-hover rounded-flourish-lg mb-3 hover:bg-opacity-80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-flourish-text transition-transform',
                      !expandedAccounts[acct.id] && '-rotate-90'
                    )}
                  />
                  <div className="text-left">
                    <p className="font-display font-bold text-flourish-text">
                      {acct.name}
                    </p>
                  </div>
                </div>
                <p className="font-display font-bold text-flourish-text">
                  {formatCurrency(acct.value)}
                </p>
              </button>

              {expandedAccounts[acct.id] && (
                <Card className={cn(
                  'p-0 overflow-hidden animate-slide-up',
                  acct.id === 'investment' ? 'stagger-6' : acct.id === 'savings' ? 'stagger-5' : 'stagger-4'
                )}>
                  <div className="divide-y divide-flourish-border">
                    {acct.holdings.map((holding, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: getMerchantColor(holding.ticker) }}
                          >
                            <span className="text-white font-bold text-xs">
                              {holding.ticker.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-bold text-flourish-text">
                              {holding.ticker}
                            </p>
                            <p className="font-body text-sm text-flourish-muted">
                              {holding.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-right">
                          <div className="min-w-[100px]">
                            <p className="font-display font-bold text-flourish-text">
                              {formatCurrency(holding.value)}
                            </p>
                            <p className="font-body text-xs text-flourish-muted">
                              {formatPercent(holding.weight)}
                            </p>
                          </div>

                          <div className="min-w-[80px]">
                            <Badge
                              variant={holding.performance >= 0 ? 'success' : 'danger'}
                              className="flex items-center gap-1 justify-end"
                            >
                              {holding.performance >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {formatPercent(holding.performance)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-flourish-hover border-t border-flourish-border">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-sm font-medium text-flourish-text">
                        Account Total
                      </p>
                      <p className="font-display font-bold text-flourish-text">
                        {formatCurrency(acct.value)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>

        {/* Portfolio Summary */}
        <Card className="p-6 mt-8 animate-slide-up stagger-7 bg-gradient-to-br from-flourish-orange/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-flourish-muted mb-1">Total Portfolio Value</p>
              <p className="font-display text-3xl font-bold text-flourish-text">
                {formatCurrency(totalPortfolioValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-body text-sm text-flourish-muted mb-1">YTD Return</p>
              <p className="font-display text-2xl font-bold text-green-600">
                +{formatPercent(8.5)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
