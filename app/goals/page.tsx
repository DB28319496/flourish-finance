'use client';

import { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign, Trash2, Edit2, X } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatCurrency, type Goal } from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { cn } from '@/lib/utils';

// Convert a free-form deadline like "Dec 2026" to ISO date string for <input type="date">
function dateStringToIso(str: string): string {
  if (!str) return '';
  // If already ISO, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

// Convert ISO date back to human-friendly "Jan 2028" format for storage/display
function isoToMonthYear(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const DEFAULT_GOALS: Omit<Goal, 'id' | 'createdAt'>[] = [
  { name: 'Emergency Fund', target: 15000, current: 10500, icon: '🛡️', color: '#10b981', deadline: 'Dec 2026', monthlyContribution: 500 },
  { name: 'Vacation Fund', target: 5000, current: 2800, icon: '✈️', color: '#3b82f6', deadline: 'Aug 2026', monthlyContribution: 300 },
  { name: 'New Car Down Payment', target: 8000, current: 1200, icon: '🚗', color: '#f59e0b', deadline: 'Jun 2027', monthlyContribution: 400 },
  { name: 'Home Down Payment', target: 60000, current: 18500, icon: '🏠', color: '#8b5cf6', deadline: 'Jan 2028', monthlyContribution: 1500 },
];

const EMOJI_OPTIONS = ['🛡️', '✈️', '🚗', '🏠', '🎓', '💍', '👶', '💻', '🎯', '📚', '🏥', '💰'];
const COLOR_OPTIONS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, isUsingMockData } = useData();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Use mock data if no saved goals yet
  const displayGoals: (Goal | Omit<Goal, 'id' | 'createdAt'>)[] = goals.length > 0
    ? goals
    : DEFAULT_GOALS.map((g, i) => ({ ...g, id: `mock-${i}`, createdAt: 0 }));

  const totalSaved = displayGoals.reduce((sum, g) => sum + g.current, 0);
  const totalTarget = displayGoals.reduce((sum, g) => sum + g.target, 0);

  const handleSave = async (formData: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal && !editingGoal.id.startsWith('mock-')) {
      await updateGoal(editingGoal.id, formData);
    } else {
      await addGoal(formData);
    }
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('mock-')) return;
    await deleteGoal(id);
  };

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-bold text-flourish-text">Goals</h1>
              <Badge variant="warning" className="text-[10px] font-semibold tracking-wider">BETA</Badge>
            </div>
            <p className="mt-1 text-flourish-secondary">
              {isUsingMockData ? 'Sign in to save goals across devices' : 'Track your savings progress toward what matters most'}
            </p>
          </div>
          <button
            onClick={() => { setEditingGoal(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium"
          >
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
            <p className="font-display text-2xl font-bold text-flourish-text">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </p>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {displayGoals.map((goal, idx) => {
            const progress = goal.target > 0 ? goal.current / goal.target : 0;
            const remaining = goal.target - goal.current;
            const goalId = 'id' in goal ? goal.id : `mock-${idx}`;
            const isMock = goalId.startsWith('mock-');

            return (
              <Card key={goalId} className={cn('p-6 animate-slide-up', `stagger-${idx + 3}`)}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{goal.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-display text-lg font-bold text-flourish-text">{goal.name}</h3>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-lg font-bold text-flourish-text">
                          {formatCurrency(goal.current)}
                          <span className="text-flourish-muted font-normal text-sm"> / {formatCurrency(goal.target)}</span>
                        </p>
                        <button
                          onClick={() => { setEditingGoal(goal as Goal); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-flourish-muted hover:text-flourish-dark hover:bg-flourish-hover transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isMock && (
                          <button
                            onClick={() => handleDelete(goalId)}
                            className="p-1.5 rounded-lg text-flourish-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="my-3">
                      <div className="h-3 bg-[#e8ddd4] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: goal.color }}
                        />
                      </div>
                    </div>

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

      {/* Form Modal */}
      {showForm && (
        <GoalForm
          initial={editingGoal}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}

function GoalForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Goal | null;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [target, setTarget] = useState(initial?.target?.toString() || '');
  const [current, setCurrent] = useState(initial?.current?.toString() || '0');
  const [deadline, setDeadline] = useState(initial?.deadline || '');
  const [monthlyContribution, setMonthlyContribution] = useState(initial?.monthlyContribution?.toString() || '0');
  const [icon, setIcon] = useState(initial?.icon || '🎯');
  const [color, setColor] = useState(initial?.color || '#10b981');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      target: parseFloat(target) || 0,
      current: parseFloat(current) || 0,
      deadline: deadline || 'No deadline',
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      icon,
      color,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-flourish-border">
          <h2 className="font-display text-xl font-bold text-flourish-dark">
            {initial ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Emergency Fund"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-flourish-dark mb-1.5">Target Amount</label>
              <input
                type="number"
                step="0.01"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                placeholder="15000"
                className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-flourish-dark mb-1.5">Current</label>
              <input
                type="number"
                step="0.01"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-flourish-dark mb-1.5">Deadline</label>
              <input
                type="date"
                value={dateStringToIso(deadline)}
                onChange={(e) => setDeadline(isoToMonthYear(e.target.value))}
                className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-flourish-dark mb-1.5">Monthly ($)</label>
              <input
                type="number"
                step="0.01"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-xl transition-all',
                    icon === e ? 'bg-flourish-orange/10 ring-2 ring-flourish-orange' : 'hover:bg-flourish-hover'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-flourish-dark' : ''
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-flourish-dark border border-flourish-border rounded-xl hover:bg-flourish-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-flourish-orange rounded-xl hover:bg-orange-600 transition-colors"
            >
              {initial ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
