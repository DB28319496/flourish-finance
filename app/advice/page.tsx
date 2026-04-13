'use client';

import { useState } from 'react';
import {
  Sparkles, TrendingUp, Shield, PiggyBank, CreditCard,
  ChevronRight, ThumbsDown, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { SubscriptionAuditCard } from '@/components/ai-insight-cards';
import { useData } from '@/lib/data-context';
import { cn } from '@/lib/utils';
import type { ComputedInsight } from '@/lib/compute-finance';

// Map icon name strings to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard, TrendingUp, Shield, PiggyBank, AlertTriangle, Sparkles,
};

// Demo insights for unauthenticated users — signed-in users get AI-generated advice
const fallbackInsights: ComputedInsight[] = [
  {
    id: 1, category: 'Welcome', iconName: 'Sparkles', color: '#E5633A', bgColor: 'bg-orange-50',
    title: 'Sign in to see personalized insights',
    description: 'Once you connect your accounts, your AI advisor will surface real spending trends, budget warnings, tax opportunities, and savings recommendations tailored to your actual data.',
    impact: 'Unlock full insights', priority: 'positive',
  },
  {
    id: 2, category: 'Example', iconName: 'CreditCard', color: '#6b7280', bgColor: 'bg-gray-50',
    title: 'Example: Dining spending up X%',
    description: 'When your spending patterns shift, Flourish AI will flag them here with specific dollar amounts and suggestions for cutting back.',
    impact: 'Demo', priority: 'medium',
  },
  {
    id: 3, category: 'Example', iconName: 'PiggyBank', color: '#6b7280', bgColor: 'bg-gray-50',
    title: 'Example: Goal milestone progress',
    description: 'When you\'re ahead of or behind your savings pace, you\'ll see specific projections here.',
    impact: 'Demo', priority: 'positive',
  },
];

const priorityConfig = {
  high: { label: 'Action Needed', variant: 'danger' as const },
  medium: { label: 'Suggestion', variant: 'warning' as const },
  positive: { label: 'Great Job', variant: 'success' as const },
};

export default function AdvicePage() {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const { insights: computedInsights, isUsingMockData } = useData();

  const allInsights = computedInsights.length > 0 ? computedInsights : fallbackInsights;
  const visibleInsights = allInsights.filter((i) => !dismissed.has(i.id));

  const actionItems = allInsights.filter((i) => i.priority === 'high').length;
  const suggestions = allInsights.filter((i) => i.priority === 'medium').length;
  const potentialSavings = allInsights
    .filter((i) => i.impact.includes('$'))
    .reduce((sum, i) => {
      const match = i.impact.match(/\$(\d+(?:\.\d+)?)/);
      return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-4xl font-bold text-flourish-text">Advice</h1>
            <div className="w-8 h-8 rounded-lg bg-flourish-orange/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-flourish-orange" />
            </div>
          </div>
          <p className="text-flourish-secondary">
            {isUsingMockData
              ? 'Personalized insights based on your spending, saving, and investing patterns'
              : 'Real-time insights generated from your connected account data'}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 animate-slide-up">
            <p className="font-body text-sm text-flourish-muted mb-1">Action Items</p>
            <p className="font-display text-3xl font-bold text-red-500">{actionItems}</p>
          </Card>
          <Card className="p-6 animate-slide-up stagger-1">
            <p className="font-body text-sm text-flourish-muted mb-1">Suggestions</p>
            <p className="font-display text-3xl font-bold text-amber-500">{suggestions}</p>
          </Card>
          <Card className="p-6 animate-slide-up stagger-2">
            <p className="font-body text-sm text-flourish-muted mb-1">Potential Monthly Savings</p>
            <p className="font-display text-3xl font-bold text-emerald-500">
              ${potentialSavings.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Subscription Audit */}
        <div className="mb-6">
          <SubscriptionAuditCard />
        </div>

        {/* Insights */}
        <div className="space-y-4">
          {visibleInsights.map((insight, idx) => {
            const Icon = ICON_MAP[insight.iconName] || Sparkles;
            const priority = priorityConfig[insight.priority];

            return (
              <Card
                key={insight.id}
                className={cn('p-6 animate-slide-up', `stagger-${idx + 3}`)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', insight.bgColor)}>
                    <Icon className="w-6 h-6" style={{ color: insight.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium text-flourish-muted uppercase tracking-wider">{insight.category}</span>
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </div>

                    <h3 className="font-display text-base font-bold text-flourish-text mb-2">{insight.title}</h3>
                    <p className="text-sm text-flourish-muted leading-relaxed mb-3">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: insight.color }}>
                        {insight.impact}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDismissed((prev) => new Set(prev).add(insight.id))}
                          className="p-1.5 rounded-lg text-flourish-muted hover:text-flourish-dark hover:bg-flourish-hover transition-colors"
                          title="Dismiss"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Dispatch event for sidebar's AI chat panel to pick up
                            window.dispatchEvent(
                              new CustomEvent('flourish:ask-ai', {
                                detail: { prompt: `Tell me more about this insight and what I should do: "${insight.title}"` }
                              })
                            );
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-flourish-orange hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Ask AI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
