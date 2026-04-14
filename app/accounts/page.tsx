"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  Banknote,
  TrendingUp,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  SectionHeader,
  Sparkline,
  ProgressBar,
  EmptyState,
} from "@/components/ui";
import { AccountDetailDrawer } from "@/components/account-detail-drawer";
import { ManualAccountModal } from "@/components/manual-account-modal";
import { MerchantLogo } from "@/components/merchant-logo";
import type { ManualAccount } from "@/lib/mock-data";
import {
  formatCurrency,
} from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";
import { PlaidLinkButton } from "@/components/plaid-link-button";

// Utility to get icon component by name
function getIconComponent(
  iconName: string,
  className?: string
) {
  const icons: Record<string, React.ReactNode> = {
    Banknote: <Banknote className={className} />,
    TrendingUp: <TrendingUp className={className} />,
    CreditCard: <CreditCard className={className} />,
  };
  return icons[iconName] || null;
}

// Account initial circle color generator
function getInitialColor(accountName: string): string {
  const colors = [
    "#E5633A",
    "#4D8FDB",
    "#2B8A3E",
    "#7C3AED",
    "#E03131",
    "#0891B2",
  ];
  return colors[accountName.charCodeAt(0) % colors.length];
}

// Format last synced time
function formatLastSynced(timeStr: string): string {
  return timeStr;
}

// Stacked horizontal bar — used in summary sidebar for composition
function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className="flex h-2 w-full rounded-full overflow-hidden bg-flourish-bg">
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
          title={`${seg.label}: ${seg.value}`}
        />
      ))}
    </div>
  );
}

export default function AccountsPage() {
  const {
    accountGroups,
    netWorthTimeline,
    hiddenAccountIds,
    toggleAccountHidden,
    manualAccounts,
    addManualAccount,
    updateManualAccount,
    deleteManualAccount,
    refreshAccounts,
    refreshTransactions,
    refreshInvestments,
    isLoading,
    isUsingMockData,
  } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshAccounts(), refreshTransactions(90), refreshInvestments()]);
    } finally {
      setRefreshing(false);
    }
  };

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [manualAccountModal, setManualAccountModal] = useState<ManualAccount | null | 'new'>(null);
  const [summaryMode, setSummaryMode] = useState<'totals' | 'percent'>('totals');

  const handleDownloadCSV = () => {
    const rows = [['Institution', 'Account', 'Type', 'Subtype', 'Balance']];
    for (const g of accountGroups) {
      for (const a of g.accounts) {
        rows.push([
          a.institution,
          a.name,
          g.label,
          a.subtype,
          String(a.balance),
        ]);
      }
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flourish-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["cash", "invest", "credit", "depository", "investment", "loan"])
  );

  // Totals exclude hidden accounts
  const visibleAccounts = (g: typeof accountGroups[0]) =>
    g.accounts.filter((a) => !hiddenAccountIds.has(a.id));
  const assets = accountGroups
    .filter((g) => g.type !== "creditCards" && g.type !== "loans")
    .reduce((sum, g) => sum + visibleAccounts(g).reduce((s, a) => s + a.balance, 0), 0);
  const liabilities = accountGroups
    .filter((g) => g.type === "creditCards" || g.type === "loans")
    .reduce((sum, g) => sum + visibleAccounts(g).reduce((s, a) => s + a.balance, 0), 0);
  const netWorth = assets - liabilities;

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const assetsPercent = assets > 0 ? assets / (assets + liabilities) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-flourish-text">
            Accounts
          </h1>
          <p className="mt-1 text-flourish-secondary">
            {isUsingMockData ? "Viewing demo data — sign in to connect your banks" : "Manage all your connected accounts"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isUsingMockData && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl border border-flourish-border text-sm font-medium text-flourish-dark hover:bg-flourish-hover transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className={cn("inline-block", refreshing && "animate-spin")}>↻</span>
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>
          )}
          <button
            onClick={() => setManualAccountModal('new')}
            className="px-4 py-2.5 rounded-xl border border-flourish-border text-sm font-medium text-flourish-dark hover:bg-flourish-hover transition-colors"
          >
            + Add Manual
          </button>
          <PlaidLinkButton />
        </div>
      </div>

      {/* Net Worth Header Card — Monarch style */}
      <Card className="animate-slide-up stagger-1 p-6">
        <div className="space-y-4">
          {/* Header row: NET WORTH label + controls */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-flourish-tertiary mb-1">Net Worth</p>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[32px] font-bold text-flourish-text tabular-nums leading-none">
                  {formatCurrency(netWorth)}
                </span>
                <span className="text-sm font-medium text-flourish-secondary tabular-nums">
                  <span className={netWorth >= 0 ? "text-flourish-green" : "text-flourish-red"}>
                    {netWorth >= 0 ? "↗" : "↘"} +$0.00
                  </span>
                  <span className="ml-2 text-flourish-muted">(0.0%) 1 month</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button className="px-3 py-1.5 rounded-lg bg-flourish-bg text-flourish-secondary hover:bg-flourish-tertiary/10">
                Net worth performance ▾
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-flourish-bg text-flourish-secondary hover:bg-flourish-tertiary/10">
                1 month ▾
              </button>
            </div>
          </div>

          {/* Net Worth Area Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={netWorthTimeline}
                margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4D8FDB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4D8FDB" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="var(--flourish-tertiary)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "var(--flourish-tertiary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--flourish-tertiary)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "var(--flourish-tertiary)" }}
                  width={50}
                  domain={["dataMin - 500", "dataMax + 500"]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value) => [formatCurrency(value as number), "Net Worth"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4D8FDB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Main Grid Layout: Accounts + Summary */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Accounts Column — Monarch-style grouped list */}
        <div className="space-y-3">
          {!isUsingMockData && accountGroups.length === 0 && (
            <Card className="p-0">
              <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-flourish-hover flex items-center justify-center text-flourish-tertiary">
                  <Banknote className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold text-flourish-text">No accounts connected</p>
                  <p className="text-sm text-flourish-secondary max-w-sm mx-auto">
                    Link your bank, credit cards, investments, and loans through Plaid to get a complete picture of your finances.
                  </p>
                </div>
                <PlaidLinkButton />
              </div>
            </Card>
          )}
          {accountGroups.map((group) => {
            const groupTotal = group.accounts.reduce((s, a) => s + a.balance, 0);
            const visibleTotal = group.accounts
              .filter((a) => !hiddenAccountIds.has(a.id))
              .reduce((s, a) => s + a.balance, 0);
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="bg-white rounded-xl border border-flourish-border overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-flourish-hover/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-flourish-secondary transition-transform",
                        !isExpanded && "-rotate-90"
                      )}
                    />
                    <span className="font-semibold text-flourish-text">{group.label}</span>
                    <span className="text-xs text-flourish-muted">
                      ({group.accounts.length})
                    </span>
                  </div>
                  <span className="font-display text-base font-semibold text-flourish-text tabular-nums">
                    {formatCurrency(visibleTotal)}
                  </span>
                </button>

                {/* Account rows */}
                {isExpanded && (
                  <div className="border-t border-flourish-border">
                    {group.accounts.map((account) => {
                      const creditUsagePercent =
                        account.creditLimit && account.creditLimit > 0
                          ? account.balance / account.creditLimit
                          : 0;
                      const isHidden = hiddenAccountIds.has(account.id);
                      const isManual = (account as any).isManual;
                      const manualData = isManual ? manualAccounts.find((m) => m.id === account.id) : null;

                      return (
                        <div
                          key={account.id}
                          className={cn(
                            "group flex items-center gap-4 px-5 py-3 border-t border-flourish-border first:border-t-0 hover:bg-flourish-hover/20 transition-colors cursor-pointer",
                            isHidden && "opacity-50"
                          )}
                          onClick={() => {
                            if (isManual && manualData) {
                              setManualAccountModal(manualData);
                            } else {
                              setSelectedAccountId(account.id);
                            }
                          }}
                        >
                          {/* Logo / institution initial */}
                          <MerchantLogo name={account.institution || account.name} size={36} />

                          {/* Name + subtype */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-flourish-text truncate">
                                {account.name}
                              </p>
                              {isManual && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-flourish-orange bg-flourish-orange/10 px-1.5 py-0.5 rounded">Manual</span>
                              )}
                            </div>
                            <p className="text-xs text-flourish-muted truncate">
                              {account.subtype}
                            </p>
                          </div>

                          {/* Sparkline */}
                          {account.sparklineData.length > 1 && (
                            <div className="flex-shrink-0 opacity-70">
                              <Sparkline
                                data={account.sparklineData}
                                width={80}
                                height={24}
                                color="#4D8FDB"
                              />
                            </div>
                          )}

                          {/* Balance */}
                          <div className="flex-shrink-0 text-right" style={{ minWidth: 120 }}>
                            <p className="font-display text-sm font-semibold text-flourish-text tabular-nums">
                              {formatCurrency(account.balance)}
                            </p>
                            <p className="text-xs text-flourish-muted">
                              {formatLastSynced(account.lastSyncedAt)}
                            </p>
                          </div>

                          {/* Hide toggle — only shows on hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAccountHidden(account.id);
                            }}
                            title={isHidden ? 'Show in totals' : 'Hide from totals'}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-flourish-hover transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {isHidden ? (
                              <EyeOff size={14} className="text-flourish-secondary" />
                            ) : (
                              <Eye size={14} className="text-flourish-secondary" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Sidebar — Monarch style */}
        <div className="animate-slide-up stagger-5 self-start sticky top-6">
          <Card className="p-5">
            <div className="space-y-5">
              {/* Header with Totals/Percent toggle */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-flourish-text">Summary</h3>
                <div className="flex items-center gap-0.5 rounded-lg bg-flourish-bg p-0.5 text-xs">
                  <button
                    onClick={() => setSummaryMode('totals')}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      summaryMode === 'totals' ? 'bg-white text-flourish-text shadow-sm' : 'text-flourish-secondary'
                    )}
                  >
                    Totals
                  </button>
                  <button
                    onClick={() => setSummaryMode('percent')}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      summaryMode === 'percent' ? 'bg-white text-flourish-text shadow-sm' : 'text-flourish-secondary'
                    )}
                  >
                    Percent
                  </button>
                </div>
              </div>

              {/* Assets section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-flourish-text">Assets</span>
                  <span className="font-display text-base font-semibold text-flourish-text tabular-nums">
                    {summaryMode === 'percent' ? `${assetsPercent > 0 ? (assetsPercent * 100).toFixed(1) : 0}%` : formatCurrency(assets)}
                  </span>
                </div>
                {/* Stacked progress bar showing composition */}
                <StackedBar
                  segments={accountGroups
                    .filter((g) => g.type !== 'creditCards' && g.type !== 'loans')
                    .map((g) => ({
                      label: g.label,
                      value: g.accounts.filter((a) => !hiddenAccountIds.has(a.id)).reduce((s, a) => s + a.balance, 0),
                      color: g.type === 'investments' ? '#2B8A3E' : g.type === 'cash' ? '#4D8FDB' : '#7C3AED',
                    }))
                    .filter((s) => s.value > 0)}
                />
                <div className="space-y-1.5 pt-1">
                  {accountGroups
                    .filter((g) => g.type !== 'creditCards' && g.type !== 'loans')
                    .map((g) => {
                      const total = g.accounts.filter((a) => !hiddenAccountIds.has(a.id)).reduce((s, a) => s + a.balance, 0);
                      if (total === 0) return null;
                      const color = g.type === 'investments' ? '#2B8A3E' : g.type === 'cash' ? '#4D8FDB' : '#7C3AED';
                      return (
                        <div key={g.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-flourish-secondary">{g.label}</span>
                          </div>
                          <span className="tabular-nums text-flourish-text font-medium">
                            {summaryMode === 'percent' && assets > 0 ? `${((total / assets) * 100).toFixed(1)}%` : formatCurrency(total)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Liabilities section */}
              {liabilities > 0 && (
                <div className="space-y-3 pt-3 border-t border-flourish-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-flourish-text">Liabilities</span>
                    <span className="font-display text-base font-semibold text-flourish-red tabular-nums">
                      {summaryMode === 'percent' && (assets + liabilities) > 0 ? `${((liabilities / (assets + liabilities)) * 100).toFixed(1)}%` : formatCurrency(liabilities)}
                    </span>
                  </div>
                  <StackedBar
                    segments={accountGroups
                      .filter((g) => g.type === 'creditCards' || g.type === 'loans')
                      .map((g) => ({
                        label: g.label,
                        value: g.accounts.filter((a) => !hiddenAccountIds.has(a.id)).reduce((s, a) => s + a.balance, 0),
                        color: g.type === 'creditCards' ? '#E5633A' : '#E03131',
                      }))
                      .filter((s) => s.value > 0)}
                  />
                  <div className="space-y-1.5 pt-1">
                    {accountGroups
                      .filter((g) => g.type === 'creditCards' || g.type === 'loans')
                      .map((g) => {
                        const total = g.accounts.filter((a) => !hiddenAccountIds.has(a.id)).reduce((s, a) => s + a.balance, 0);
                        if (total === 0) return null;
                        const color = g.type === 'creditCards' ? '#E5633A' : '#E03131';
                        return (
                          <div key={g.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                              <span className="text-flourish-secondary">{g.label}</span>
                            </div>
                            <span className="tabular-nums text-flourish-text font-medium">
                              {summaryMode === 'percent' && liabilities > 0 ? `${((total / liabilities) * 100).toFixed(1)}%` : formatCurrency(total)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Download CSV */}
              <button
                onClick={handleDownloadCSV}
                className="w-full text-center text-xs font-medium text-flourish-orange hover:underline pt-2 border-t border-flourish-border"
              >
                Download CSV
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Account Detail Drawer */}
      <AccountDetailDrawer
        accountId={selectedAccountId}
        accountName=""
        onClose={() => setSelectedAccountId(null)}
      />

      {/* Manual Account Modal */}
      {manualAccountModal && (
        <ManualAccountModal
          initial={manualAccountModal === 'new' ? null : manualAccountModal}
          onSave={async (data) => {
            if (manualAccountModal === 'new') {
              await addManualAccount(data);
            } else {
              await updateManualAccount(manualAccountModal.id, data);
            }
          }}
          onDelete={manualAccountModal !== 'new' ? async () => {
            await deleteManualAccount((manualAccountModal as ManualAccount).id);
          } : undefined}
          onClose={() => setManualAccountModal(null)}
        />
      )}
    </div>
  );
}
