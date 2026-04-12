'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, List, Calendar, Plus, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, PillToggle, ProgressBar, Badge } from '@/components/ui';
import { formatCurrency, formatCurrencyShort } from '@/lib/mock-data';
import { useData } from '@/lib/data-context';
import { cn, getMerchantColor } from '@/lib/utils';

type RecurringFilter = 'monthly' | 'all';
type TableSection = 'income' | 'expenses' | 'creditCards';

export default function RecurringPage() {
  const [filter, setFilter] = useState<RecurringFilter>('monthly');
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

  const { recurringTransactions } = useData();
  const router = useRouter();

  const viewTransactions = (merchant: string) => {
    router.push(`/transactions?merchant=${encodeURIComponent(merchant)}`);
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
              <button className="p-2 hover:bg-flourish-hover rounded-lg transition-colors">
                <List className="w-5 h-5 text-flourish-text" />
              </button>
              <button className="p-2 hover:bg-flourish-hover rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-flourish-text" />
              </button>
            </div>
          </div>
        </Card>

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
                      <button
                        onClick={() => viewTransactions(item.merchant)}
                        title="View transactions from this merchant"
                        className="p-2 hover:bg-flourish-border rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-flourish-muted" />
                      </button>
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
                      <button
                        onClick={() => viewTransactions(item.merchant)}
                        title="View transactions from this merchant"
                        className="p-2 hover:bg-flourish-border rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-flourish-muted" />
                      </button>
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
                      <button
                        onClick={() => viewTransactions(item.merchant)}
                        title="View transactions from this merchant"
                        className="p-2 hover:bg-flourish-border rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-flourish-muted" />
                      </button>
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
                      <button
                        onClick={() => viewTransactions(item.merchant)}
                        title="View transactions from this merchant"
                        className="p-2 hover:bg-flourish-border rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-flourish-muted" />
                      </button>
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
      </div>
    </div>
  );
}
