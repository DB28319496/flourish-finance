'use client';

import { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card, ProgressBar, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const goals = [
  {
    id: 1,
    name: 'Emergency Fund',
    target: 15000,
    current: 10500,
    icon: '🛡️',
    color: '#10b981',
    deadline: 'Dec 2026',
    monthlyContribution: 500,
  },
  {
    id: 2,
    name: 'Vacation Fund',
    target: 5000,
    current: 2800,
    icon: '✈️',
    color: '#3b82f6',
    deadline: 'Aug 2026',
    monthlyContribution: 300,
  },
  {
    id: 3,
    name: 'New Car Down Payment',
    target: 8000,
    current: 1200,
    icon: '🚗',
    color: '#f59e0b',
    deadline: 'Jun 2027',
    monthlyContribution: 400,
  },
  {
    id: 4,
    name: 'Home Down Payment',
    target: 60000,
    current: 18500,
    icon: '🏠',
    color: '#8b5cf6',
    deadline: 'Jan 2028',
    monthlyContribution: 1500,
  },
];

export default function GoalsPage() {
  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold text-flourish-text">Goals</h1>
              <Badge variant="warning" className="text-[10px] font-semibold tracking-wider">BETA</Badge>
            </div>
            <p className="mt-1 text-flourish-secondary">Track your savings progress toward what matters most</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="font-body text-sm text-flourish-muted">Total Saved</p>
            </div>
            <p className="font-display text-2xl font-bold text-flourish-text">{formatCurrency(totalSaved)}</p>
          </Card>

          <Card className="p-6 animate-slide-up stagger-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="font-body text-sm text-flourish-muted">Total Target</p>
            </div>
            <p className="font-display text-2xl font-bold text-flourish-text">{formatCurrency(totalTarget)}</p>
          </Card>

          <Card className="p-6 animate-slide-up stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="font-body text-sm text-flourish-muted">Overall Progress</p>
            </div>
            <p className="font-display text-2xl font-bold text-flourish-text">{Math.round((totalSaved / totalTarget) * 100)}%</p>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal, idx) => {
            const progress = goal.current / goal.target;
            const remaining = goal.target - goal.current;

            return (
              <Card
                key={goal.id}
                className={cn('p-6 animate-slide-up', `stagger-${idx + 3}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">{goal.icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-lg font-bold text-flourish-text">{goal.name}</h3>
                      <p className="font-display text-lg font-bold text-flourish-text">
                        {formatCurrency(goal.current)} <span className="text-flourish-muted font-normal text-sm">/ {formatCurrency(goal.target)}</span>
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-3">
                      <div className="h-3 bg-[#e8ddd4] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress * 100}%`, backgroundColor: goal.color }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-6 text-sm text-flourish-muted">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target: {goal.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{formatCurrency(goal.monthlyContribution)}/mo</span>
                      </div>
                      <span className="ml-auto font-medium" style={{ color: goal.color }}>
                        {formatCurrency(remaining)} remaining
                      </span>
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
