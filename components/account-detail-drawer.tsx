'use client';

import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { formatCurrency } from '@/lib/mock-data';
import { getMerchantColor } from '@/lib/utils';

interface AccountDetailProps {
  accountId: string | null;
  accountName: string;
  onClose: () => void;
}

export function AccountDetailDrawer({ accountId, accountName, onClose }: AccountDetailProps) {
  const { transactionGroups, accountGroups } = useData();
  const router = useRouter();

  const accountData = useMemo(() => {
    for (const group of accountGroups) {
      const found = group.accounts.find((a) => a.id === accountId);
      if (found) return { account: found, group };
    }
    return null;
  }, [accountId, accountGroups]);

  const accountTransactions = useMemo(() => {
    if (!accountId) return [];
    const flat: any[] = [];
    for (const group of transactionGroups) {
      for (const tx of group.transactions) {
        if (tx.accountId === accountId) {
          flat.push(tx);
        }
      }
    }
    return flat;
  }, [accountId, transactionGroups]);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recent = accountTransactions.filter((t) => t.date >= thirtyDaysAgo);

    let spent = 0;
    let income = 0;
    for (const tx of recent) {
      // Positive amount = expense in our stored schema (absolute value)
      spent += tx.amount;
    }

    return {
      transactionCount: accountTransactions.length,
      last30Count: recent.length,
      last30Total: spent,
    };
  }, [accountTransactions]);

  if (!accountId || !accountData) return null;

  const { account, group } = accountData;
  const isCredit = group.type === 'creditCards';
  const creditUsage = account.creditLimit ? (account.balance / account.creditLimit) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 z-[95] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[100] w-full sm:w-[520px] h-screen bg-white shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-flourish-border">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ backgroundColor: getMerchantColor(account.name) }}
            >
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-flourish-dark">{account.name}</h2>
              <p className="text-sm text-flourish-secondary flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {account.institution} · {account.subtype}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="px-6 py-5 bg-gradient-to-br from-flourish-orange/5 to-transparent">
          <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">
            {isCredit ? 'Current Balance' : 'Available Balance'}
          </p>
          <p className={`font-display text-3xl font-bold ${isCredit ? 'text-red-600' : 'text-flourish-dark'} tabular-nums`}>
            {isCredit ? '-' : ''}{formatCurrency(account.balance)}
          </p>
          {account.creditLimit && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-flourish-muted mb-1">
                <span>{creditUsage.toFixed(0)}% of {formatCurrency(account.creditLimit)} limit</span>
                <span>{formatCurrency(account.creditLimit - account.balance)} available</span>
              </div>
              <div className="h-2 bg-flourish-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(creditUsage, 100)}%`,
                    backgroundColor: creditUsage > 80 ? '#ef4444' : creditUsage > 50 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-flourish-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Transactions</p>
            <p className="font-display text-xl font-bold text-flourish-dark">{stats.transactionCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">Last 30 days</p>
            <p className="font-display text-xl font-bold text-flourish-dark">{stats.last30Count}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-flourish-muted mb-1">30d Activity</p>
            <p className="font-display text-xl font-bold text-flourish-dark">{formatCurrency(stats.last30Total)}</p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-flourish-dark uppercase tracking-wider">
              Recent Transactions
            </h3>
            <button
              onClick={() => {
                router.push(`/transactions?account=${encodeURIComponent(account.name)}`);
                onClose();
              }}
              className="text-xs font-medium text-flourish-orange hover:underline"
            >
              See all →
            </button>
          </div>

          {accountTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-flourish-secondary">No transactions yet</p>
            </div>
          ) : (
            <div className="px-4">
              {accountTransactions.slice(0, 30).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[#fdf8f4] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: getMerchantColor(tx.merchantName) + '20' }}
                  >
                    {tx.category.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-flourish-dark truncate">{tx.merchantName}</p>
                    <p className="text-xs text-flourish-muted truncate">
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {tx.category.name}
                    </p>
                  </div>
                  <p className="font-display font-semibold text-flourish-dark tabular-nums flex-shrink-0">
                    -{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Last synced */}
        <div className="px-6 py-3 border-t border-flourish-border text-center">
          <p className="text-xs text-flourish-muted">Last synced {account.lastSyncedAt}</p>
        </div>
      </div>
    </>
  );
}
