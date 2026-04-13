'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, List, Calendar, Plus, MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, PillToggle, ProgressBar, Badge } from '@/components/ui';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { cn, getMerchantColor } from '@/lib/utils';

// Dropdown menu for each recurring item
function ItemMenu({ merchant, onView, onExclude }: { merchant: string; onView: () => void; onExclude: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-flourish-border rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-flourish-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] bg-white rounded-xl shadow-flourish-hover border border-flourish-border py-1">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-flourish-dark hover:bg-flourish-hover transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-flourish-secondary" />
            View transactions
          </button>
          <button
            onClick={() => {
              if (confirm(`Stop treating "${merchant}" as recurring?\n\nThis hides it from the Recurring page. It will still appear in Transactions.`)) {
                onExclude();
                setOpen(false);
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Not recurring — hide
          </button>
        </div>
      )}
    </div>
  );
}

type RecurringFilter = 'monthly' | 'all';
type TableSection = 'income' | 'expenses' | 'creditCards';
type ViewMode = 'list' | 'calendar';

export default function RecurringPage() {
  const [filter, setFilter] = useState<RecurringFilter>('monthly');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState({ month: 4, year: 2026 });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    income: true,
    expenses: true,
    creditCards: true,
    upcomingCompleted: false
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth.month === 1) {
      setCurrentMonth({ month: 12, year: currentMonth.year - 1 });
    } else {
      setCurrentMonth({ month: currentMonth.month - 1, year: currentMonth.year });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth.month === 12) {
      setCurrentMonth({ month: 1, year: currentMonth.year + 1 });
    } else {
      setCurrentMonth({ month: currentMonth.month + 1, year: currentMonth.year });
    }
  };

  const handleToday = () => {
    setCurrentMonth({ month: 4, year: 2026 });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const { recurringTransactions, userSettings, updateUserSetting } = useData();
  const router = useRouter();

  const viewTransactions = (merchant: string) => {
    router.push(`/transactions?merchant=${encodeURIComponent(merchant)}`);
  };

  const excludeFromRecurring = (merchant: string) => {
    const current = userSettings.excludedRecurring || [];
    if (!current.some((m) => m.toLowerCase() === merchant.toLowerCase())) {
      updateUserSetting('excludedRecurring', [...current, merchant]);
    }
  };
  const incomeItems = recurringTransactions.income;
  const expenseItems = recurringTransactions.expenses;
  const creditCardItems = recurringTransactions.creditCards;

  const paidExpenses = expenseItems.filter(e => e.status === 'paid').length;
  const totalExpenses = expenseItems.length;
  const paidAmount = expenseItems
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenseAmount = expenseItems.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-4xl font-bold text-flourish-text">Recurring</h1>
          <div className="flex items-center gap-4">
            <PillToggle
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'all', label: 'All' }
              ]}
              value={filter}
              onChange={(val) => setFilter(val as RecurringFilter)}
            />
            <button className="flex items-center gap-2 px-4 py-2 bg-flourish-orange text-white rounded-flourish-lg hover:bg-orange-600 transition-colors font-body text-sm font-medium">
              <Plus className="w-4 h-4" />
              Manage recurring
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <Card className="p-6 mb-8 animate-slide-up stagger-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-flourish-hover rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-flourish-text" />
              </button>
              <div className="min-w-[180px] text-center">
                <h2 className="font-display text-xl font-bold text-flourish-text">
                  {months[currentMonth.month - 1]} {currentMonth.year}
                </h2>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-flourish-hover rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-flourish-text" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToday}
                className="px-4 py-2 border border-flourish-border rounded-flourish-lg hover:bg-flourish-hover transition-colors font-body text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list' ? 'bg-flourish-orange text-white' : 'hover:bg-flourish-hover text-flourish-text'
                )}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'calendar' ? 'bg-flourish-orange text-white' : 'hover:bg-flourish-hover text-flourish-text'
                )}
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <RecurringCalendar
            year={currentMonth.year}
            month={currentMonth.month}
            income={incomeItems}
            expenses={expenseItems}
            creditCards={creditCardItems}
            onClickItem={(item) => viewTransactions(item.merchant)}
          />
        )}

        {/* List View (existing sections) */}
        {viewMode === 'list' && <>
        {/* Income Section */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('income')}
            className="w-full flex items-center justify-between p-4 bg-flourish-hover rounded-flourish-lg mb-4 hover:bg-opacity-80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-flourish-text transition-transform',
                  !expandedSections.income && '-rotate-90'
                )}
              />
              <h2 className="font-display text-lg font-bold text-flourish-text">
                Income
              </h2>
            </div>
            <a
              href="#"
              className="text-flourish-orange hover:text-orange-600 font-body text-sm font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              + Add recurring income
            </a>
          </button>

          {expandedSections.income && (
            <Card className="p-0 overflow-hidden animate-slide-up stagger-1">
              <div className="divide-y divide-flourish-border">
                {incomeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: getMerchantColor(item.merchant) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-flourish-text">
                          {item.merchant}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          {item.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right min-w-[100px]">
                        <p className="font-display font-bold text-green-600">
                          {formatCurrencyShort(item.amount)}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          {item.nextDate}
                        </p>
                      </div>
                      <ItemMenu
                        merchant={item.merchant}
                        onView={() => viewTransactions(item.merchant)}
                        onExclude={() => excludeFromRecurring(item.merchant)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Expenses Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-flourish-text">
              Expenses
            </h2>
            <a
              href="#"
              className="text-flourish-orange hover:text-orange-600 font-body text-sm font-medium transition-colors"
            >
              + Set up bill sync
            </a>
          </div>

          <Card className="p-6 mb-4 animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-body text-sm text-flourish-muted mb-1">Total Due</p>
                <p className="font-display text-2xl font-bold text-flourish-text">
                  {formatCurrency(totalExpenseAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm text-flourish-muted mb-1">
                  {paidExpenses} of {totalExpenses} paid
                </p>
              </div>
            </div>
            <ProgressBar
              progress={Math.round((paidExpenses / totalExpenses) * 100)}
              color="bg-green-500"
            />
          </Card>
        </div>

        {/* Credit Cards Section */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('creditCards')}
            className="w-full flex items-center justify-between p-4 bg-flourish-hover rounded-flourish-lg mb-4 hover:bg-opacity-80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-flourish-text transition-transform',
                  !expandedSections.creditCards && '-rotate-90'
                )}
              />
              <h2 className="font-display text-lg font-bold text-flourish-text">
                Credit Cards
              </h2>
            </div>
            <a
              href="#"
              className="text-flourish-orange hover:text-orange-600 font-body text-sm font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              + Add card
            </a>
          </button>

          {expandedSections.creditCards && (
            <Card className="p-0 overflow-hidden animate-slide-up stagger-3">
              <div className="divide-y divide-flourish-border">
                {creditCardItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: getMerchantColor(item.merchant) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-flourish-text">
                          {item.merchant}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          Due every {item.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right min-w-[100px]">
                        <p className="font-display font-bold text-red-600">
                          {formatCurrencyShort(item.amount)}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          {item.daysUntil} days
                        </p>
                      </div>
                      <ItemMenu
                        merchant={item.merchant}
                        onView={() => viewTransactions(item.merchant)}
                        onExclude={() => excludeFromRecurring(item.merchant)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Upcoming & Completed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming */}
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text mb-4">
              Upcoming
            </h3>
            <Card className="p-0 overflow-hidden animate-slide-up stagger-4">
              <div className="divide-y divide-flourish-border">
                {expenseItems.filter(e => e.status === 'upcoming').slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full"
                        style={{ backgroundColor: getMerchantColor(item.merchant) }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-flourish-text">
                          {item.merchant}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{item.emoji}</span>
                          <p className="font-body text-xs text-flourish-muted">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right min-w-[100px]">
                        <p className="font-display font-bold text-flourish-text">
                          {formatCurrencyShort(item.amount)}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          {item.daysUntil} days
                        </p>
                      </div>
                      <ItemMenu
                        merchant={item.merchant}
                        onView={() => viewTransactions(item.merchant)}
                        onExclude={() => excludeFromRecurring(item.merchant)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-flourish-hover border-t border-flourish-border text-right font-body text-sm font-medium text-flourish-text">
                Total: {formatCurrency(expenseItems.filter(e => e.status === 'upcoming').reduce((sum, e) => sum + e.amount, 0))}
              </div>
            </Card>
          </div>

          {/* Completed */}
          <div>
            <h3 className="font-display text-lg font-bold text-flourish-text mb-4">
              Completed
            </h3>
            <Card className="p-0 overflow-hidden animate-slide-up stagger-5">
              <div className="divide-y divide-flourish-border">
                {expenseItems.filter(e => e.status === 'paid').slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 hover:bg-flourish-hover transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getMerchantColor(item.merchant) }}
                      >
                        <span className="text-white font-bold">✓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-flourish-text">
                          {item.merchant}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{item.emoji}</span>
                          <p className="font-body text-xs text-flourish-muted">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right min-w-[100px]">
                        <p className="font-display font-bold text-flourish-text">
                          {formatCurrencyShort(item.amount)}
                        </p>
                        <p className="font-body text-xs text-flourish-muted">
                          3 days ago
                        </p>
                      </div>
                      <ItemMenu
                        merchant={item.merchant}
                        onView={() => viewTransactions(item.merchant)}
                        onExclude={() => excludeFromRecurring(item.merchant)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-flourish-hover border-t border-flourish-border text-right font-body text-sm font-medium text-flourish-text">
                Total: {formatCurrency(expenseItems.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0))}
              </div>
            </Card>
          </div>
        </div>
        </>}
      </div>
    </div>
  );
}

// =============================================================================
// Calendar view component
// =============================================================================

function RecurringCalendar({
  year,
  month,
  income,
  expenses,
  creditCards,
  onClickItem,
}: {
  year: number;
  month: number; // 1-12
  income: any[];
  expenses: any[];
  creditCards: any[];
  onClickItem: (item: any) => void;
}) {
  // Build all items with their day-of-month
  const allItems = [
    ...income.map((i) => ({ ...i, type: 'income' })),
    ...expenses.map((e) => ({ ...e, type: 'expense' })),
    ...creditCards.map((c) => ({ ...c, type: 'credit' })),
  ].map((item) => {
    // parse dueDate string "15th", "22nd" etc. or nextDate "Apr 15"
    let day = 1;
    if (item.dueDate) {
      const m = String(item.dueDate).match(/\d+/);
      if (m) day = parseInt(m[0]);
    } else if (item.nextDate) {
      const d = new Date(`${item.nextDate}, ${year}`);
      if (!isNaN(d.getTime())) day = d.getDate();
    }
    return { ...item, day };
  });

  // Group by day
  const byDay: Record<number, any[]> = {};
  for (const item of allItems) {
    if (!byDay[item.day]) byDay[item.day] = [];
    byDay[item.day].push(item);
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();
  const todayYear = today.getFullYear();

  return (
    <Card className="p-6 animate-slide-up">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider text-flourish-muted py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={`empty-${idx}`} />;
          const items = byDay[d] || [];
          const isToday = d === todayDate && month === todayMonth && year === todayYear;
          return (
            <div
              key={d}
              className={cn(
                "min-h-[90px] p-2 rounded-lg border transition-colors",
                isToday ? 'border-flourish-orange bg-flourish-orange/5' : 'border-flourish-border hover:bg-flourish-hover/50'
              )}
            >
              <div className={cn("text-xs font-semibold mb-1", isToday ? 'text-flourish-orange' : 'text-flourish-dark')}>
                {d}
              </div>
              <div className="space-y-1">
                {items.slice(0, 3).map((item, i) => {
                  const color = item.type === 'income' ? 'bg-emerald-100 text-emerald-800'
                    : item.type === 'credit' ? 'bg-red-100 text-red-800'
                    : 'bg-flourish-orange/20 text-flourish-orange';
                  return (
                    <button
                      key={`${item.merchant}-${i}`}
                      onClick={() => onClickItem(item)}
                      className={cn("w-full px-1.5 py-0.5 rounded text-[10px] font-medium text-left truncate", color)}
                      title={`${item.merchant} - $${item.amount}`}
                    >
                      {item.emoji} {item.merchant}
                    </button>
                  );
                })}
                {items.length > 3 && (
                  <div className="text-[10px] text-flourish-muted">+{items.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-flourish-muted">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Income</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-flourish-orange/20 border border-flourish-orange/50" /> Expense</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Credit Card</div>
      </div>
    </Card>
  );
}
