'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Shield, PiggyBank, CreditCard, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

const insights = [
  {
    id: 1,
    category: 'Spending',
    icon: CreditCard,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    title: 'Dining out spending is up 23% this month',
    description: 'You\'ve spent $482 on dining out so far in April, compared to $392 last month. Consider cooking at home a few more nights to stay within your budget.',
    impact: 'Save ~$90/month',
    priority: 'high' as const,
  },
  {
    id: 2,
    category: 'Savings',
    icon: PiggyBank,
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    title: 'You\'re on track to hit your emergency fund goal',
    description: 'At your current savings rate of $500/month, you\'ll reach your $15,000 emergency fund target by December 2026. Keep it up!',
    impact: 'On track',
    priority: 'positive' as const,
  },
  {
    id: 3,
    category: 'Investments',
    icon: TrendingUp,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    title: 'Consider rebalancing your portfolio',
    description: 'Your tech allocation is at 58%, which is above your 45% target. Consider moving some funds into bonds or international equities for better diversification.',
    impact: 'Reduce risk',
    priority: 'medium' as const,
  },
  {
    id: 4,
    category: 'Protection',
    icon: Shield,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    title: 'Set up automatic bill pay for your student loan',
    description: 'You\'ve been paying your student loan manually each month. Setting up autopay can save you 0.25% on your interest rate and prevent late payments.',
    impact: 'Save $87/year',
    priority: 'medium' as const,
  },
  {
    id: 5,
    category: 'Spending',
    icon: CreditCard,
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    title: 'You have 3 unused subscriptions',
    description: 'We noticed you haven\'t used Hulu, Adobe Creative Cloud, or ClassPass in the last 60 days. Canceling these would save you $52.97/month.',
    impact: 'Save $52.97/mo',
    priority: 'high' as const,
  },
];

const priorityConfig = {
  high: { label: 'Action Needed', variant: 'danger' as const },
  medium: { label: 'Suggestion', variant: 'warning' as const },
  positive: { label: 'Great Job', variant: 'success' as const },
};

export default function AdvicePage() {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id));

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
          <p className="text-flourish-secondary">Personalized insights based on your spending, saving, and investing patterns</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 animate-slide-up">
            <p className="font-body text-sm text-flourish-muted mb-1">Action Items</p>
            <p className="font-display text-3xl font-bold text-red-500">
              {insights.filter((i) => i.priority === 'high').length}
            </p>
          </Card>
          <Card className="p-6 animate-slide-up stagger-1">
            <p className="font-body text-sm text-flourish-muted mb-1">Suggestions</p>
            <p className="font-display text-3xl font-bold text-amber-500">
              {insights.filter((i) => i.priority === 'medium').length}
            </p>
          </Card>
          <Card className="p-6 animate-slide-up stagger-2">
            <p className="font-body text-sm text-flourish-muted mb-1">Potential Monthly Savings</p>
            <p className="font-display text-3xl font-bold text-emerald-500">$142.97</p>
          </Card>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          {visibleInsights.map((insight, idx) => {
            const Icon = insight.icon;
            const priority = priorityConfig[insight.priority];

            return (
              <Card
                key={insight.id}
                className={cn('p-6 animate-slide-up', `stagger-${idx + 3}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', insight.bgColor)}>
                    <Icon className="w-6 h-6" style={{ color: insight.color }} />
                  </div>

                  {/* Content */}
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
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-flourish-orange hover:bg-orange-50 rounded-lg transition-colors">
                          View Details
                          <ChevronRight className="w-4 h-4" />
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
