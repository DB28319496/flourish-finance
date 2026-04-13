'use client';

import React from 'react';
import { Sparkles, RefreshCw, Loader2, AlertTriangle, TrendingUp, Shield, Target as TargetIcon } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { useAIAnalysis } from '@/lib/use-ai-analysis';
import { useAuth } from '@/lib/auth-context';

interface PortfolioAnalysis {
  summary: string;
  observations: {
    type: 'concentration' | 'diversification' | 'performance' | 'risk' | 'opportunity';
    headline: string;
    detail: string;
  }[];
  recommendations?: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
  }[];
}

const OBSERVATION_ICONS: Record<string, React.ComponentType<any>> = {
  concentration: AlertTriangle,
  diversification: Shield,
  performance: TrendingUp,
  risk: AlertTriangle,
  opportunity: TargetIcon,
};

const OBSERVATION_COLORS: Record<string, string> = {
  concentration: 'text-amber-600 bg-amber-50',
  diversification: 'text-blue-600 bg-blue-50',
  performance: 'text-emerald-600 bg-emerald-50',
  risk: 'text-red-600 bg-red-50',
  opportunity: 'text-purple-600 bg-purple-50',
};

export function PortfolioAICard() {
  const { user } = useAuth();
  const { analysis, generatedAt, loading, error, refresh } = useAIAnalysis<PortfolioAnalysis>('portfolio-analysis');

  if (!user) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-flourish-orange/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-flourish-orange/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-flourish-orange" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text">AI Portfolio Analysis</h3>
            {generatedAt && (
              <p className="text-xs text-flourish-muted">
                Updated {new Date(generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-flourish-orange hover:bg-flourish-orange/10 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {analysis ? 'Refresh' : 'Analyze'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {!analysis && !loading && (
        <div className="py-6 text-center">
          <p className="text-sm text-flourish-muted mb-3">
            Let your AI advisor analyze your holdings, concentration risk, and opportunities.
          </p>
          <p className="text-xs text-flourish-muted">Cached for 6 hours.</p>
        </div>
      )}

      {loading && !analysis && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-flourish-orange" />
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-flourish-dark">{analysis.summary}</p>

          <div className="space-y-2">
            {analysis.observations?.map((o, i) => {
              const Icon = OBSERVATION_ICONS[o.type] || Sparkles;
              const cls = OBSERVATION_COLORS[o.type] || 'text-flourish-dark bg-flourish-hover';
              return (
                <div key={i} className="flex gap-3 p-3 bg-white rounded-xl border border-flourish-border">
                  <div className={`w-8 h-8 rounded-lg ${cls.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cls.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-flourish-dark">{o.headline}</p>
                    <p className="text-xs text-flourish-muted mt-0.5 leading-relaxed">{o.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="pt-2 border-t border-flourish-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-2">Recommendations</p>
              <div className="space-y-2">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge
                      variant={r.priority === 'high' ? 'danger' : r.priority === 'medium' ? 'warning' : 'default'}
                      className="uppercase text-[9px] tracking-wider flex-shrink-0"
                    >
                      {r.priority}
                    </Badge>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-flourish-dark">{r.action}</p>
                      <p className="text-xs text-flourish-muted mt-0.5">{r.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
