"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Plus,
  ChevronRight,
  X,
  Repeat,
  Flag,
  Clock,
} from "lucide-react";
import { Card, PillToggle, Dropdown, Badge } from "@/components/ui";
import {
  formatCurrency,
  type Transaction,
  type TransactionDateGroup,
} from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn, getMerchantColor, getAccountColor, formatDate } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

type FilterTab = "All" | "Receipts";

// =============================================================================
// Main Page
// =============================================================================

export default function TransactionsPage() {
  const { transactionGroups, updateTransaction, markAsTransfer, transferIds, splits, updateSplit, deleteSplit } = useData();

  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Pre-fill search from URL query param (e.g., /transactions?merchant=Netflix&account=Chase)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const merchant = params.get("merchant");
    const account = params.get("account");
    if (merchant) setSearchQuery(merchant);
    else if (account) setSearchQuery(account);
  }, []);
  const [transactionFilter, setTransactionFilter] = useState("All transactions");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Apply search + filter + sort to transaction groups
  const groupsWithTotals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Filter transactions per group
    const filtered = transactionGroups.map((group) => {
      let txs = group.transactions;

      // Text search on merchant, statement, category, notes, tags
      if (q) {
        const qTrimHash = q.replace(/^#/, "");
        txs = txs.filter((t) => {
          const tags = ((t as any).tags || []) as string[];
          return (
            t.merchantName?.toLowerCase().includes(q) ||
            t.originalStatement?.toLowerCase().includes(q) ||
            t.category.name?.toLowerCase().includes(q) ||
            t.category.group?.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q) ||
            t.accountName?.toLowerCase().includes(q) ||
            tags.some((tag) => tag.toLowerCase().includes(qTrimHash))
          );
        });
      }

      // Filter dropdown
      const groupDate = new Date(group.date + "T00:00:00");
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - groupDate.getTime()) / (1000 * 60 * 60 * 24));

      if (transactionFilter === "Flagged") {
        txs = txs.filter((t) => t.isFlagged);
      } else if (transactionFilter === "Recurring") {
        txs = txs.filter((t) => t.isRecurring);
      } else if (transactionFilter === "Pending") {
        txs = txs.filter((t) => t.isPending);
      } else if (transactionFilter === "Last 7 days" && daysAgo > 7) {
        txs = [];
      } else if (transactionFilter === "Last 30 days" && daysAgo > 30) {
        txs = [];
      }

      // Receipts filter (tab)
      if (filterTab === "Receipts") {
        txs = txs.filter((t) => (t.notes || "").toLowerCase().includes("receipt"));
      }

      return {
        ...group,
        transactions: txs,
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      };
    }).filter((g) => g.transactions.length > 0); // drop empty groups

    // Sorting affects the group order
    if (sortBy === "Oldest") {
      filtered.reverse();
    } else if (sortBy === "Highest Amount") {
      filtered.sort((a, b) => b.total - a.total);
    } else if (sortBy === "Lowest Amount") {
      filtered.sort((a, b) => a.total - b.total);
    }
    // default "Newest" — already sorted by date desc from DataContext

    return filtered;
  }, [transactionGroups, searchQuery, transactionFilter, sortBy, filterTab]);

  // Get total of all transactions
  const grandTotal = useMemo(
    () =>
      groupsWithTotals.reduce((sum, group) => sum + group.total, 0),
    [groupsWithTotals]
  );

  const handleDetailClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditingTransaction({ ...transaction });
  };

  const handleSaveTransaction = async () => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        merchantName: editingTransaction.merchantName,
        notes: editingTransaction.notes,
        isFlagged: editingTransaction.isFlagged,
        isRecurring: editingTransaction.isRecurring,
        category: editingTransaction.category.name,
        tags: (editingTransaction as any).tags,
      });
    }
    setSelectedTransaction(null);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = () => {
    setSelectedTransaction(null);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-flourish-text">Transactions</h1>
        <PillToggle
          options={["All", "Receipts"]}
          value={filterTab}
          onChange={(v: string) => setFilterTab(v as FilterTab)}
          size="sm"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flourish-secondary" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-flourish-bg bg-flourish-card pl-9 pr-3 py-2 text-sm text-flourish-text placeholder-flourish-tertiary transition-colors focus:border-flourish-orange focus:outline-none"
          />
        </div>

        {/* Clear search */}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="rounded-lg bg-flourish-bg px-3 py-2 text-sm text-flourish-secondary transition-colors hover:bg-flourish-tertiary/20 hover:text-flourish-text"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Dropdown
          options={[
            "All transactions",
            "Pending",
            "Recurring",
            "Flagged",
            "Last 7 days",
            "Last 30 days",
          ]}
          value={transactionFilter}
          onChange={setTransactionFilter}
        />

        <Dropdown
          options={["Newest", "Oldest", "Highest Amount", "Lowest Amount"]}
          value={sortBy}
          onChange={setSortBy}
        />

      </div>

      {/* Empty state */}
      {groupsWithTotals.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-flourish-secondary">
            {searchQuery
              ? `No transactions match "${searchQuery}"`
              : transactionFilter !== "All transactions"
              ? `No transactions match the "${transactionFilter}" filter`
              : "No transactions yet"}
          </p>
          {(searchQuery || transactionFilter !== "All transactions") && (
            <button
              onClick={() => { setSearchQuery(""); setTransactionFilter("All transactions"); }}
              className="mt-3 text-sm font-medium text-flourish-orange hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      )}

      {/* Transaction Groups */}
      <div className="space-y-6">
        {groupsWithTotals.map((group, groupIndex) => (
          <div key={group.id} className="space-y-3">
            {/* Date Header with Daily Total */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-flourish-text">
                {formatDate(group.date)}
              </h2>
              <span className="text-sm font-medium text-flourish-secondary">
                {formatCurrency(group.total)}
              </span>
            </div>

            {/* Transactions */}
            <div className="space-y-2">
              {group.transactions.map((transaction, txIndex) => {
                const merchantColor = getMerchantColor(transaction.merchantName);
                const accountColor = getAccountColor(transaction.accountId);

                return (
                  <button
                    key={transaction.id}
                    onClick={() => handleDetailClick(transaction)}
                    className={cn(
                      "w-full animate-slide-up rounded-lg bg-flourish-card p-4 transition-all hover:shadow-flourish-hover",
                      groupIndex < 2 && `stagger-${Math.min(txIndex + 1, 6)}`
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Side: Merchant Info */}
                      <div className="flex flex-1 items-center gap-3 min-w-0">
                        {/* Merchant Initial Circle */}
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: merchantColor }}
                        >
                          <span className="text-xs font-bold text-white">
                            {transaction.merchantName.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Merchant Name and Category */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-flourish-text truncate">
                            {transaction.merchantName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-flourish-secondary">
                              {transaction.category.emoji} {transaction.category.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Account */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accountColor }}
                        />
                        <span className="text-xs text-flourish-secondary">
                          {transaction.accountName}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {transaction.isPending && (
                          <Badge variant="warning">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                        {transaction.isRecurring && (
                          <Badge variant="default">
                            <Repeat className="h-3 w-3" />
                          </Badge>
                        )}
                        {transaction.isFlagged && (
                          <Badge variant="danger">
                            <Flag className="h-3 w-3" />
                          </Badge>
                        )}
                        {((transaction as any).tags || []).slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="default">#{tag}</Badge>
                        ))}
                      </div>

                      {/* Amount and Chevron */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-sm font-semibold tabular-nums text-flourish-text">
                          {formatCurrency(transaction.amount)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-flourish-secondary flex-shrink-0" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Slide-over Panel */}
      {selectedTransaction && editingTransaction && (
        <TransactionDetailPanel
          transaction={selectedTransaction}
          editingTransaction={editingTransaction}
          isTransfer={transferIds.has(selectedTransaction.id)}
          existingSplit={splits[selectedTransaction.id]}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          onToggleTransfer={(flag) => markAsTransfer(selectedTransaction.id, flag)}
          onSaveSplit={(list) => updateSplit(selectedTransaction.id, list)}
          onDeleteSplit={() => deleteSplit(selectedTransaction.id)}
          onClose={() => {
            setSelectedTransaction(null);
            setEditingTransaction(null);
          }}
          onEditingChange={setEditingTransaction}
        />
      )}
    </div>
  );
}

// =============================================================================
// Transaction Detail Panel
// =============================================================================

interface TransactionDetailPanelProps {
  transaction: Transaction;
  editingTransaction: Transaction;
  isTransfer: boolean;
  existingSplit?: { id: string; splits: { category: string; amount: number; notes?: string }[] };
  onSave: () => void;
  onDelete: () => void;
  onToggleTransfer: (isTransfer: boolean) => Promise<void>;
  onSaveSplit: (splits: { category: string; amount: number; notes?: string }[]) => Promise<void>;
  onDeleteSplit: () => Promise<void>;
  onClose: () => void;
  onEditingChange: (transaction: Transaction) => void;
}

function TransactionDetailPanel({
  transaction,
  editingTransaction,
  isTransfer,
  existingSplit,
  onSave,
  onDelete,
  onToggleTransfer,
  onSaveSplit,
  onDeleteSplit,
  onClose,
  onEditingChange,
}: TransactionDetailPanelProps) {
  const merchantColor = getMerchantColor(transaction.merchantName);
  const [showSplit, setShowSplit] = useState(!!existingSplit);
  const [splitRows, setSplitRows] = useState<{ category: string; amount: number; notes?: string }[]>(
    existingSplit?.splits || [
      { category: transaction.category.name, amount: transaction.amount / 2 },
      { category: "", amount: transaction.amount / 2 },
    ]
  );

  const splitTotal = splitRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const splitValid = Math.abs(splitTotal - transaction.amount) < 0.01 && splitRows.every((r) => r.category.trim() !== "");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md animate-slide-in-right overflow-y-auto bg-flourish-card shadow-flourish-hover">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-flourish-bg bg-flourish-card p-6">
          <h2 className="text-lg font-semibold text-flourish-text">
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-flourish-secondary transition-colors hover:bg-flourish-bg hover:text-flourish-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Amount Section */}
          <div className="text-center">
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: merchantColor }}
            >
              <span className="text-2xl font-bold text-white">
                {transaction.merchantName.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-flourish-secondary">Amount</p>
            <p className="font-mono text-4xl font-bold tabular-nums text-flourish-text">
              {formatCurrency(editingTransaction.amount)}
            </p>
          </div>

          {/* Original Statement */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Original Statement
            </label>
            <p className="mt-2 rounded-lg bg-flourish-bg px-3 py-2 text-sm text-flourish-text">
              {editingTransaction.originalStatement}
            </p>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Account
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-flourish-bg px-3 py-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getAccountColor(transaction.accountId) }}
              />
              <span className="text-sm text-flourish-text">{editingTransaction.accountName}</span>
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Merchant
            </label>
            <input
              type="text"
              value={editingTransaction.merchantName}
              onChange={(e) =>
                onEditingChange({
                  ...editingTransaction,
                  merchantName: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-flourish-bg bg-flourish-card px-3 py-2 text-sm text-flourish-text placeholder-flourish-tertiary transition-colors focus:border-flourish-orange focus:outline-none"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Date
            </label>
            <input
              type="date"
              value={editingTransaction.date}
              onChange={(e) =>
                onEditingChange({
                  ...editingTransaction,
                  date: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-flourish-bg bg-flourish-card px-3 py-2 text-sm text-flourish-text transition-colors focus:border-flourish-orange focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Category
            </label>
            <div className="mt-2 rounded-lg bg-flourish-bg px-3 py-2">
              <span className="text-sm text-flourish-text">
                {editingTransaction.category.emoji} {editingTransaction.category.name}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Notes
            </label>
            <textarea
              value={editingTransaction.notes}
              onChange={(e) =>
                onEditingChange({
                  ...editingTransaction,
                  notes: e.target.value,
                })
              }
              placeholder="Add a note..."
              className="mt-2 w-full rounded-lg border border-flourish-bg bg-flourish-card px-3 py-2 text-sm text-flourish-text placeholder-flourish-tertiary transition-colors focus:border-flourish-orange focus:outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Custom Tags */}
          <TagsEditor
            tags={(editingTransaction as any).tags || []}
            onChange={(tags) => onEditingChange({ ...editingTransaction, tags } as any)}
          />

          {/* Tags Section - toggle buttons */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onEditingChange({ ...editingTransaction, isFlagged: !editingTransaction.isFlagged })}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  editingTransaction.isFlagged
                    ? "bg-red-50 text-flourish-red border border-red-200"
                    : "bg-flourish-bg text-flourish-secondary border border-transparent hover:bg-red-50 hover:text-flourish-red"
                )}
              >
                <Flag className="h-3 w-3" />
                {editingTransaction.isFlagged ? "Flagged" : "Flag"}
              </button>
              <button
                onClick={() => onEditingChange({ ...editingTransaction, isRecurring: !editingTransaction.isRecurring })}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  editingTransaction.isRecurring
                    ? "bg-flourish-bg text-flourish-text border border-flourish-border"
                    : "bg-flourish-bg text-flourish-secondary border border-transparent hover:text-flourish-text"
                )}
              >
                <Repeat className="h-3 w-3" />
                {editingTransaction.isRecurring ? "Recurring" : "Mark recurring"}
              </button>
              {transaction.isPending && (
                <Badge variant="warning">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              )}
              {(transaction as any).isTransfer && (
                <Badge variant="default">
                  ↔ Transfer
                </Badge>
              )}
            </div>
          </div>

          {/* Transfer toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-flourish-bg">
            <div>
              <p className="text-sm font-medium text-flourish-dark">Mark as transfer</p>
              <p className="text-xs text-flourish-secondary">Transfers don't count as income or expense</p>
            </div>
            <button
              onClick={() => onToggleTransfer(!isTransfer)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                isTransfer ? "bg-flourish-orange" : "bg-gray-300"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  isTransfer && "translate-x-5"
                )}
              />
            </button>
          </div>

          {/* Split section */}
          <div className="border border-flourish-border rounded-lg">
            <button
              onClick={() => setShowSplit(!showSplit)}
              className="w-full flex items-center justify-between px-3 py-3"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-flourish-dark">Split transaction</p>
                <p className="text-xs text-flourish-secondary">
                  {existingSplit ? `${existingSplit.splits.length} splits saved` : 'Divide across multiple categories'}
                </p>
              </div>
              <ChevronRight
                size={16}
                className={cn("text-flourish-secondary transition-transform", showSplit && "rotate-90")}
              />
            </button>

            {showSplit && (
              <div className="px-3 pb-3 space-y-2 border-t border-flourish-border pt-3">
                {splitRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={row.category}
                      onChange={(e) => {
                        const next = [...splitRows];
                        next[idx] = { ...next[idx], category: e.target.value };
                        setSplitRows(next);
                      }}
                      placeholder="Category"
                      className="flex-1 px-2 py-1.5 border border-flourish-border rounded-md text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => {
                        const next = [...splitRows];
                        next[idx] = { ...next[idx], amount: parseFloat(e.target.value) || 0 };
                        setSplitRows(next);
                      }}
                      className="w-24 px-2 py-1.5 border border-flourish-border rounded-md text-sm text-right"
                    />
                    <button
                      onClick={() => setSplitRows(splitRows.filter((_, i) => i !== idx))}
                      disabled={splitRows.length <= 2}
                      className="p-1 text-flourish-secondary hover:text-red-500 disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSplitRows([...splitRows, { category: "", amount: 0 }])}
                  className="text-xs font-medium text-flourish-orange hover:underline"
                >
                  + Add row
                </button>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-flourish-border">
                  <span className="text-flourish-secondary">Total of splits:</span>
                  <span className={cn("font-semibold tabular-nums", splitValid ? "text-flourish-green" : "text-flourish-red")}>
                    {formatCurrency(splitTotal)} / {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (splitValid) await onSaveSplit(splitRows);
                    }}
                    disabled={!splitValid}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-flourish-orange rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    Save split
                  </button>
                  {existingSplit && (
                    <button
                      onClick={async () => { await onDeleteSplit(); setShowSplit(false); }}
                      className="px-3 py-2 text-xs font-medium text-flourish-red border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            className="w-full rounded-lg bg-flourish-orange py-2 text-sm font-medium text-white transition-all hover:shadow-flourish-hover"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Tags Editor — custom tag chips on transactions
// =============================================================================

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const t = value.trim();
    if (!t) return;
    if (tags.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
      setValue("");
      return;
    }
    onChange([...tags, t]);
    setValue("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
        Custom Tags
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2 p-2 rounded-lg border border-flourish-bg bg-flourish-card min-h-[44px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-flourish-orange/10 text-flourish-orange text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            } else if (e.key === "Backspace" && !value && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder={tags.length === 0 ? "Add tags (e.g., business, tax-deductible)..." : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-flourish-text placeholder-flourish-tertiary outline-none"
        />
      </div>
      <p className="mt-1 text-[10px] text-flourish-muted">
        Press Enter or comma to add · Backspace to remove last
      </p>
    </div>
  );
}
