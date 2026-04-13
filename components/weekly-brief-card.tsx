'use client';

import React from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAIAnalysis } from '@/lib/use-ai-analysis';
import { useAuth } from '@/lib/auth-context';

interface WeeklyBrief {
  greeting: string;
  highlights: { emoji: string; headline: string; detail: string }[];
  actionItems?: { label: string; detail: string }[];
}

export function WeeklyBriefCard() {
  const { user } = useAuth();
  const { analysis, generatedAt, loading, error, refresh } = useAIAnalysis<WeeklyBrief>('weekly-brief');

  if (!user) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-flourish-orange/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-flourish-orange/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-flourish-orange" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text">Your Weekly Brief</h3>
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
          {analysis ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      {!analysis && !loading && (
        <div className="py-6 text-center">
          <p className="text-sm text-flourish-muted mb-3">
            Click <span className="font-semibold text-flourish-orange">Generate</span> to get a personalized weekly brief from your AI advisor.
          </p>
          <p className="text-xs text-flourish-muted">Briefs analyze your spending trends, goals, and budgets. Cached for 24h.</p>
        </div>
      )}

      {loading && !analysis && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-flourish-orange" />
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-flourish-dark italic">{analysis.greeting}</p>

          <div className="space-y-3">
            {analysis.highlights?.map((h, i) => (
              <div key={i} className="flex gap-3 p-3 bg-white rounded-xl border border-flourish-border">
                <div className="text-xl flex-shrink-0">{h.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-flourish-dark">{h.headline}</p>
                  <p className="text-xs text-flourish-muted mt-0.5 leading-relaxed">{h.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {analysis.actionItems && analysis.actionItems.length > 0 && (
            <div className="pt-2 border-t border-flourish-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-flourish-muted mb-2">Action Items</p>
              <div className="space-y-2">
                {analysis.actionItems.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-flourish-orange/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-flourish-orange">
                      {i + 1}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-flourish-dark">{item.label}</p>
                      <p className="text-xs text-flourish-muted mt-0.5">{item.detail}</p>
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
