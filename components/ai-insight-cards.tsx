'use client';

import React from 'react';
import { Sparkles, RefreshCw, Loader2, DollarSign } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { useAIAnalysis } from '@/lib/use-ai-analysis';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/mock-data';

// ==============================================================
// Tax Opportunities Card — tax-loss harvesting
// ==============================================================

interface TaxOpportunities {
  summary: string;
  opportunities: {
    ticker: string;
    loss: string;
    action: string;
    rationale: string;
  }[];
  caveats: string[];
}

export function TaxOpportunitiesCard() {
  const { user } = useAuth();
  const { analysis, generatedAt, loading, error, refresh } = useAIAnalysis<TaxOpportunities>('tax-opportunities');

  if (!user) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text">Tax-Loss Opportunities</h3>
            {generatedAt && (
              <p className="text-xs text-flourish-muted">
                Updated {new Date(generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {analysis ? 'Refresh' : 'Analyze'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {!analysis && !loading && (
        <p className="text-sm text-flourish-muted text-center py-4">
          Analyze your holdings for tax-loss harvesting opportunities.
        </p>
      )}

      {loading && !analysis && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <p className="text-sm text-flourish-dark">{analysis.summary}</p>

          {analysis.opportunities?.length > 0 ? (
            <div className="space-y-2">
              {analysis.opportunities.map((opp, i) => (
                <div key={i} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-base font-bold text-flourish-dark">{opp.ticker}</span>
                    <span className="text-sm font-bold text-emerald-700 tabular-nums">{opp.loss}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-900 mb-1">{opp.action}</p>
                  <p className="text-xs text-flourish-muted leading-relaxed">{opp.rationale}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-flourish-muted">No tax-loss harvesting opportunities detected right now — all positions are at or above cost basis.</p>
          )}

          {analysis.caveats && analysis.caveats.length > 0 && (
            <div className="pt-3 border-t border-flourish-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-2">Important</p>
              {analysis.caveats.map((c, i) => (
                <p key={i} className="text-xs text-flourish-muted leading-relaxed">• {c}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ==============================================================
// Subscription Audit Card
// ==============================================================

interface SubscriptionAudit {
  totalMonthly: string;
  subscriptions: {
    merchant: string;
    monthly: string;
    category: string;
    lastCharged: string;
    suggestion: 'keep' | 'review' | 'cancel';
    why: string;
  }[];
}

export function SubscriptionAuditCard() {
  const { user } = useAuth();
  const { analysis, generatedAt, loading, error, refresh } = useAIAnalysis<SubscriptionAudit>('subscription-audit');

  if (!user) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text">Subscription Audit</h3>
            {generatedAt && (
              <p className="text-xs text-flourish-muted">
                Updated {new Date(generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {analysis ? 'Refresh' : 'Audit'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {!analysis && !loading && (
        <p className="text-sm text-flourish-muted text-center py-4">
          Find subscriptions you could cancel to save money. Cached for 7 days.
        </p>
      )}

      {loading && !analysis && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between p-3 bg-purple-50/50 rounded-xl">
            <span className="text-xs uppercase tracking-wider text-purple-700 font-semibold">Total Monthly Subscriptions</span>
            <span className="font-display text-xl font-bold text-purple-700 tabular-nums">{analysis.totalMonthly}</span>
          </div>

          {analysis.subscriptions?.length > 0 ? (
            <div className="space-y-2">
              {analysis.subscriptions.map((sub, i) => {
                const suggColor = sub.suggestion === 'cancel' ? 'danger' : sub.suggestion === 'review' ? 'warning' : 'success';
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-flourish-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-flourish-dark truncate">{sub.merchant}</p>
                        <Badge variant={suggColor} className="uppercase text-[9px]">{sub.suggestion}</Badge>
                      </div>
                      <p className="text-xs text-flourish-muted">{sub.category} · last {sub.lastCharged}</p>
                      <p className="text-xs text-flourish-muted mt-0.5 italic">{sub.why}</p>
                    </div>
                    <span className="font-display font-bold text-flourish-dark tabular-nums ml-3">{sub.monthly}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-flourish-muted text-center py-2">No subscriptions detected in your recent transactions.</p>
          )}
        </div>
      )}
    </Card>
  );
}
