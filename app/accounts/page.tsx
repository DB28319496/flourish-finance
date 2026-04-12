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
} from "lucide-react";
import {
  Card,
  SectionHeader,
  Sparkline,
  ProgressBar,
} from "@/components/ui";
import { AccountDetailDrawer } from "@/components/account-detail-drawer";
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

export default function AccountsPage() {
  const { accountGroups, netWorthTimeline, isLoading, isUsingMockData } = useData();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["cash", "invest", "credit", "depository", "investment", "loan"])
  );

  const assets = accountGroups
    .filter((g) => g.type !== "creditCards" && g.type !== "loans")
    .reduce((sum, g) => sum + g.accounts.reduce((s, a) => s + a.balance, 0), 0);
  const liabilities = accountGroups
    .filter((g) => g.type === "creditCards" || g.type === "loans")
    .reduce((sum, g) => sum + g.accounts.reduce((s, a) => s + a.balance, 0), 0);
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
        <PlaidLinkButton />
      </div>

      {/* Net Worth Header Card */}
      <Card className="animate-slide-up stagger-1">
        <div className="space-y-6">
          <div>
            <SectionHeader title="Net Worth" />
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-money-xl text-flourish-text tabular-nums">
                {formatCurrency(netWorth)}
              </span>
              <span className="text-flourish-green text-sm font-medium">
                +$2,413.22 (1 month)
              </span>
            </div>
          </div>

          {/* Net Worth Area Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={netWorthTimeline}
                margin={{ top: 12, right: 12, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5633A" stopOpacity={0.15} />
                    <stop
                      offset="95%"
                      stopColor="#E5633A"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="var(--flourish-tertiary)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "var(--flourish-tertiary)" }}
                />
                <YAxis
                  stroke="var(--flourish-tertiary)"
                  style={{ fontSize: "11px" }}
                  tick={{ fill: "var(--flourish-tertiary)" }}
                  width={50}
                  domain={["dataMin - 1000", "dataMax + 1000"]}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--flourish-card)",
                    border: "1px solid var(--flourish-bg)",
                    borderRadius: "12px",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
                  }}
                  formatter={(value) => [formatCurrency(value as number), "Value"]}
                  labelStyle={{ color: "var(--flourish-text)" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#E5633A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Main Grid Layout: Accounts + Summary */}
      <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr]">
        {/* Accounts Column */}
        <div className="space-y-4">
          {accountGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              className={cn(
                "animate-slide-up",
                `stagger-${Math.min(groupIndex + 2, 6)}`
              )}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full"
              >
                <Card hover className="transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-flourish-secondary">
                        {getIconComponent(group.icon, "w-5 h-5")}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-flourish-text">
                          {group.label}
                        </p>
                        <p className="text-xs text-flourish-secondary">
                          {group.accounts.length}{" "}
                          {group.accounts.length === 1 ? "account" : "accounts"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-money-md text-flourish-text tabular-nums">
                        {formatCurrency(
                          group.accounts.reduce((sum, a) => sum + a.balance, 0)
                        )}
                      </span>
                      {expandedGroups.has(group.id) ? (
                        <ChevronUp className="w-4 h-4 text-flourish-secondary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-flourish-secondary" />
                      )}
                    </div>
                  </div>
                </Card>
              </button>

              {/* Expanded Account List */}
              {expandedGroups.has(group.id) && (
                <div className="space-y-2 mt-2">
                  {group.accounts.map((account) => {
                    const initialColor = getInitialColor(account.name);
                    const creditUsagePercent =
                      account.creditLimit && account.creditLimit > 0
                        ? account.balance / account.creditLimit
                        : 0;

                    return (
                      <Card
                        key={account.id}
                        hover
                        className="p-4 cursor-pointer"
                        onClick={() => setSelectedAccountId(account.id)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Account Initial Circle */}
                          <div
                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: initialColor }}
                          >
                            {account.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Account Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-flourish-text truncate">
                              {account.name}
                            </p>
                            <p className="text-xs text-flourish-secondary truncate">
                              {account.subtype}
                            </p>
                          </div>

                          {/* Sparkline */}
                          {account.sparklineData.length > 0 && (
                            <div className="flex-shrink-0">
                              <Sparkline
                                data={account.sparklineData}
                                width={60}
                                height={24}
                                color={initialColor}
                              />
                            </div>
                          )}

                          {/* Balance */}
                          <div className="flex-shrink-0 text-right">
                            <p className="font-display text-money-md text-flourish-text tabular-nums">
                              {formatCurrency(account.balance)}
                            </p>
                            <p className="text-xs text-flourish-secondary">
                              {formatLastSynced(account.lastSyncedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Credit Card Usage Bar */}
                        {account.creditLimit && creditUsagePercent > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-flourish-secondary">
                                Credit Used
                              </span>
                              <span className="text-flourish-text font-medium">
                                {((creditUsagePercent) * 100).toFixed(0)}% of{" "}
                                {formatCurrency(account.creditLimit)}
                              </span>
                            </div>
                            <ProgressBar
                              progress={creditUsagePercent}
                              color={
                                creditUsagePercent > 0.9
                                  ? "var(--flourish-red)"
                                  : "var(--flourish-orange)"
                              }
                              height={3}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Sidebar */}
        <div className="animate-slide-up stagger-5">
          <Card>
            <div className="space-y-6">
              <SectionHeader title="Assets vs Liabilities" />

              {/* Main Summary Row */}
              <div className="space-y-4">
                {/* Assets */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-flourish-green" />
                    <span className="text-sm text-flourish-secondary">
                      Assets
                    </span>
                    <span className="ml-auto font-display text-money-md text-flourish-text tabular-nums">
                      {formatCurrency(assets)}
                    </span>
                  </div>
                  <ProgressBar
                    progress={assetsPercent}
                    color="var(--flourish-green)"
                    height={6}
                  />
                </div>

                {/* Liabilities */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-flourish-red" />
                    <span className="text-sm text-flourish-secondary">
                      Liabilities
                    </span>
                    <span className="ml-auto font-display text-money-md text-flourish-text tabular-nums">
                      {formatCurrency(liabilities)}
                    </span>
                  </div>
                  <ProgressBar
                    progress={1 - assetsPercent}
                    color="var(--flourish-red)"
                    height={6}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-flourish-bg" />

              {/* Net Worth Summary */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-flourish-tertiary">
                  Total Net Worth
                </p>
                <p className="font-display text-money-lg text-flourish-text tabular-nums">
                  {formatCurrency(netWorth)}
                </p>
                <p className="text-xs text-flourish-secondary">
                  Updated just now
                </p>
              </div>

              {/* Asset Breakdown */}
              <div className="space-y-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-flourish-tertiary">
                  Breakdown
                </p>
                {accountGroups.map((group) => {
                  const groupTotal = group.accounts.reduce(
                    (sum, a) => sum + a.balance,
                    0
                  );
                  const isLiability =
                    group.type === "creditCards" || group.type === "loans";
                  const displayValue = isLiability ? -groupTotal : groupTotal;
                  const percent =
                    Math.abs(displayValue) /
                    (assets + liabilities);

                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-flourish-secondary">
                        {group.label}
                      </span>
                      <span className="font-medium text-flourish-text tabular-nums">
                        {formatCurrency(displayValue)} ({(percent * 100).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
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
    </div>
  );
}
