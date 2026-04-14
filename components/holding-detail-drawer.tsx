'use client';

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ExternalLink, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuotes, useHistory, useNews, formatRelativeTime } from '@/lib/use-market-data';
import { formatCurrency } from '@/lib/mock-data';
import { getMerchantColor, cn } from '@/lib/utils';
import { useModal } from '@/lib/use-modal';

interface HoldingDetailProps {
  holding: {
    id: string;
    ticker: string;
    name: string;
    quantity: number;
    value: number;
    costBasis: number;
    weight: number;
  } | null;
  onClose: () => void;
}

const RANGES = [
  { key: '5d', label: '5D' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
];

export function HoldingDetailDrawer({ holding, onClose }: HoldingDetailProps) {
  useModal(holding ? onClose : null);
  const [range, setRange] = useState('3mo');
  const ticker = holding?.ticker || '';
  const { quotes } = useQuotes(ticker ? [ticker] : []);
  const { data: history, loading: historyLoading } = useHistory(ticker || null, range);
  const { articles } = useNews(ticker ? [ticker] : []);

  if (!holding) return null;

  const quote = quotes[ticker];
  const isGain = (quote?.change ?? 0) >= 0;
  const liveValue = quote?.price ? quote.price * holding.quantity : holding.value;
  const costBasis = holding.costBasis || 0;
  const totalGain = liveValue - costBasis;
  const totalGainPct = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 z-[95] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[100] w-full sm:w-[560px] h-screen bg-white shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-flourish-border">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ backgroundColor: getMerchantColor(ticker) }}
            >
              {ticker.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-flourish-dark">{ticker}</h2>
                {quote?.marketState && (
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    quote.marketState === 'REGULAR'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {quote.marketState === 'REGULAR' ? '● Live' : quote.marketState.toLowerCase()}
                  </span>
                )}
              </div>
              <p className="text-sm text-flourish-secondary">{holding.name}</p>
              {quote?.exchange && <p className="text-xs text-flourish-muted mt-0.5">{quote.exchange}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        {/* Live Price Card */}
        <div className="px-6 py-5 bg-gradient-to-br from-flourish-orange/5 to-transparent">
          {quote?.price ? (
            <>
              <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Current Price</p>
              <div className="flex items-baseline gap-3">
                <p className="font-display text-3xl font-bold text-flourish-dark tabular-nums">
                  {formatCurrency(quote.price)}
                </p>
                <div className={cn("flex items-center gap-1 font-semibold", isGain ? "text-green-600" : "text-red-600")}>
                  {isGain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="tabular-nums">
                    {isGain ? '+' : ''}{formatCurrency(Math.abs(quote.change))} ({isGain ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <p className="text-xs text-flourish-muted mt-1">
                {quote.dayLow && quote.dayHigh && `Day range ${formatCurrency(quote.dayLow)} – ${formatCurrency(quote.dayHigh)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Last Price</p>
              <p className="font-display text-3xl font-bold text-flourish-dark tabular-nums">
                {formatCurrency(holding.value / holding.quantity)}
              </p>
            </>
          )}
        </div>

        {/* Position Summary */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-flourish-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Shares</p>
            <p className="font-display text-lg font-bold text-flourish-dark tabular-nums">
              {holding.quantity.toFixed(holding.quantity < 10 ? 4 : 2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Market Value</p>
            <p className="font-display text-lg font-bold text-flourish-dark tabular-nums">{formatCurrency(liveValue)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Total Return</p>
            <p className={cn("font-display text-lg font-bold tabular-nums", totalGain >= 0 ? 'text-green-600' : 'text-red-600')}>
              {totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Chart + News */}
        <div className="flex-1 overflow-y-auto">
          {/* Range selector */}
          <div className="flex items-center gap-2 px-6 pt-4">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                  range === r.key
                    ? "bg-flourish-orange text-white"
                    : "bg-flourish-bg text-flourish-secondary hover:bg-flourish-hover"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="px-4 py-4">
            <div className="h-48">
              {historyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-flourish-orange" />
                </div>
              ) : history && history.points.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.points} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={history.summary.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={history.summary.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      stroke="#9ca3af"
                      style={{ fontSize: 10 }}
                      tickFormatter={(t) =>
                        new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis
                      stroke="#9ca3af"
                      style={{ fontSize: 10 }}
                      width={45}
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(v) => `$${v.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: 12 }}
                      labelFormatter={(t) => new Date((t as number) * 1000).toLocaleString()}
                      formatter={(v: number) => [formatCurrency(v), 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={history.summary.change >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-flourish-muted">
                  No chart data available
                </div>
              )}
            </div>

            {history?.summary && (
              <div className="flex items-center justify-between px-2 mt-1 text-xs">
                <span className="text-flourish-muted">
                  {range.toUpperCase()} range: {formatCurrency(history.summary.low)} – {formatCurrency(history.summary.high)}
                </span>
                <span className={cn("font-semibold tabular-nums", history.summary.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {history.summary.change >= 0 ? '+' : ''}{history.summary.changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Key Stats */}
          {quote && (
            <div className="px-6 py-4 border-t border-flourish-border">
              <h3 className="font-display text-sm font-bold text-flourish-dark uppercase tracking-wider mb-3">Key Stats</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {quote.marketCap && (
                  <div>
                    <p className="text-xs text-flourish-muted">Market Cap</p>
                    <p className="font-medium text-flourish-dark">${(quote.marketCap / 1_000_000_000).toFixed(2)}B</p>
                  </div>
                )}
                {quote.peRatio && (
                  <div>
                    <p className="text-xs text-flourish-muted">P/E Ratio</p>
                    <p className="font-medium text-flourish-dark">{quote.peRatio.toFixed(2)}</p>
                  </div>
                )}
                {quote.previousClose && (
                  <div>
                    <p className="text-xs text-flourish-muted">Previous Close</p>
                    <p className="font-medium text-flourish-dark">{formatCurrency(quote.previousClose)}</p>
                  </div>
                )}
                {quote.volume && (
                  <div>
                    <p className="text-xs text-flourish-muted">Volume</p>
                    <p className="font-medium text-flourish-dark">{quote.volume.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* News */}
          {articles.length > 0 && (
            <div className="px-6 py-4 border-t border-flourish-border">
              <h3 className="font-display text-sm font-bold text-flourish-dark uppercase tracking-wider mb-3">Recent News</h3>
              <div className="space-y-3">
                {articles.slice(0, 6).map((a) => (
                  <a
                    key={a.uuid}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg hover:bg-[#fdf8f4] transition-colors"
                  >
                    <p className="text-sm font-medium text-flourish-dark leading-snug line-clamp-2">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-flourish-muted">
                      <span>{a.publisher}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(a.publishedAt)}</span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
