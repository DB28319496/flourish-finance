"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Eye,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";

// =============================================================================
// Budget Page — Monarch-style table layout
// =============================================================================

type BudgetView = "month" | "year" | "decade";

export default function BudgetPage() {
  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState<BudgetView>("month");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showUnbudgeted, setShowUnbudgeted] = useState<Set<string>>(new Set());
  const [rightTab, setRightTab] = useState<"summary" | "income" | "expenses">("summary");

  const { budgetSections, updateBudgetTarget, addBudgetCategory, deleteBudgetCategory } = useData();
  const [addModal, setAddModal] = useState<null | { section: "income" | "fixed" | "flexible" | "nonMonthly" }>(null);

  // Header month label
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const goToPrevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goToNextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const goToToday = () => setMonth(new Date());

  const toggleSection = (id: string) => {
    const next = new Set(collapsedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setCollapsedSections(next);
  };

  const toggleUnbudgeted = (id: string) => {
    const next = new Set(showUnbudgeted);
    next.has(id) ? next.delete(id) : next.add(id);
    setShowUnbudgeted(next);
  };

  // Split into Income vs Expense groupings (Expenses has Fixed/Flexible/Non-Monthly sub-sections)
  const incomeSections = budgetSections.filter((s) => s.type === "income");
  const expenseSections = budgetSections.filter((s) => s.type !== "income");

  const calcTotals = (sec: typeof budgetSections[0]) => ({
    budget: sec.categories.reduce((s, c) => s + c.budgetAmount, 0),
    actual: sec.categories.reduce((s, c) => s + c.actualAmount, 0),
  });

  const incomeTotals = useMemo(() => {
    const budget = incomeSections.reduce((s, sec) => s + calcTotals(sec).budget, 0);
    const actual = incomeSections.reduce((s, sec) => s + calcTotals(sec).actual, 0);
    return { budget, actual, remaining: budget - actual };
  }, [incomeSections]);

  const expenseTotals = useMemo(() => {
    const budget = expenseSections.reduce((s, sec) => s + calcTotals(sec).budget, 0);
    const actual = expenseSections.reduce((s, sec) => s + calcTotals(sec).actual, 0);
    return { budget, actual, remaining: budget - actual };
  }, [expenseSections]);

  const leftToBudget = incomeTotals.budget - expenseTotals.budget;

  return (
    <div className="-mx-4 sm:-mx-8 lg:-mx-12 -my-6 lg:-my-10 flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-flourish-border bg-white">
        <h1 className="font-display text-2xl font-semibold text-flourish-dark">{monthLabel}</h1>

        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-flourish-hover transition-colors">
            <ChevronLeft size={16} className="text-flourish-secondary" />
          </button>
          <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-flourish-hover transition-colors">
            <ChevronRight size={16} className="text-flourish-secondary" />
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-flourish-secondary hover:text-flourish-dark rounded-lg border border-flourish-border hover:bg-flourish-hover transition-colors"
          >
            Today
          </button>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-flourish-bg p-0.5 text-xs ml-1">
            {(["month", "year", "decade"] as BudgetView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium capitalize transition-colors",
                  view === v ? "bg-white text-flourish-text shadow-sm" : "text-flourish-secondary"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <Link
            href="/settings"
            title="Settings"
            className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg border border-flourish-border text-xs font-medium text-flourish-secondary hover:bg-flourish-hover transition-colors"
          >
            <Settings size={14} /> Settings
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Budget table */}
        <div className="flex-1 overflow-y-auto">
          {/* Income section */}
          <BudgetTable
            title="Income"
            sections={incomeSections}
            totals={incomeTotals}
            totalLabel="Total Income"
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            showUnbudgeted={showUnbudgeted}
            toggleUnbudgeted={toggleUnbudgeted}
            updateBudgetTarget={updateBudgetTarget}
            deleteBudgetCategory={deleteBudgetCategory}
            onAddCategory={(section: string) => setAddModal({ section: section as any })}
          />

          {/* Expenses section */}
          <BudgetTable
            title="Expenses"
            sections={expenseSections}
            totals={expenseTotals}
            totalLabel="Total Expenses"
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            showUnbudgeted={showUnbudgeted}
            toggleUnbudgeted={toggleUnbudgeted}
            updateBudgetTarget={updateBudgetTarget}
            deleteBudgetCategory={deleteBudgetCategory}
            onAddCategory={(section: string) => setAddModal({ section: section as any })}
          />
        </div>

        {/* Right sidebar */}
        <aside className="w-[320px] border-l border-flourish-border bg-white overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Left to budget card */}
            <div className={cn(
              "rounded-xl px-5 py-5 text-center",
              leftToBudget >= 0 ? "bg-emerald-50" : "bg-red-50"
            )}>
              <p className={cn(
                "font-display text-3xl font-bold",
                leftToBudget >= 0 ? "text-emerald-700" : "text-red-700"
              )}>
                {formatCurrency(leftToBudget)}
              </p>
              <p className={cn("text-xs font-medium mt-1", leftToBudget >= 0 ? "text-emerald-700" : "text-red-700")}>
                Left to budget
                <span className="ml-1 text-flourish-muted">ⓘ</span>
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-flourish-border -mx-5 px-5">
              {(["summary", "income", "expenses"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={cn(
                    "flex-1 pb-2.5 pt-1 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                    rightTab === t
                      ? "text-flourish-dark border-flourish-orange"
                      : "text-flourish-secondary border-transparent hover:text-flourish-dark"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Summary tab */}
            {rightTab === "summary" && (
              <div className="space-y-4">
                <SidebarSection title="Income" totals={incomeTotals} color="emerald" />
                <SidebarSection title="Expenses" totals={expenseTotals} color="red" />
              </div>
            )}

            {/* Income tab */}
            {rightTab === "income" && (
              <div className="space-y-4">
                {incomeSections.map((sec) => (
                  <SidebarSection key={sec.id} title={sec.name} totals={calcTotals(sec)} color="emerald" />
                ))}
              </div>
            )}

            {/* Expenses tab */}
            {rightTab === "expenses" && (
              <div className="space-y-4">
                {expenseSections.map((sec) => (
                  <SidebarSection key={sec.id} title={sec.name} totals={calcTotals(sec)} color="red" />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Add category modal */}
      {addModal && (
        <AddCategoryModal
          section={addModal.section}
          onSave={async (meta, amount) => {
            await addBudgetCategory(meta, amount);
          }}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Budget Table (Income block or Expenses block)
// =============================================================================

function BudgetTable({
  title,
  sections,
  totals,
  totalLabel,
  collapsedSections,
  toggleSection,
  showUnbudgeted,
  toggleUnbudgeted,
  updateBudgetTarget,
  deleteBudgetCategory,
  onAddCategory,
}: any) {
  // Map UI section id → storage section key
  const sectionKeyMap: Record<string, string> = {
    income: "income",
    fixed: "fixed",
    flex: "flexible",
    nonmo: "nonMonthly",
  };
  return (
    <div className="bg-white">
      {/* Top-level heading row */}
      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center gap-3 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-flourish-tertiary bg-flourish-bg/60 border-b border-flourish-border">
        <div>{title}</div>
        <div className="text-right">Budget</div>
        <div className="text-right">Actual</div>
        <div className="text-right">Remaining</div>
      </div>

      {sections.map((section: any) => {
        const t = {
          budget: section.categories.reduce((s: number, c: any) => s + c.budgetAmount, 0),
          actual: section.categories.reduce((s: number, c: any) => s + c.actualAmount, 0),
        };
        const remaining = t.budget - t.actual;
        const isCollapsed = collapsedSections.has(section.id);
        const budgeted = section.categories.filter((c: any) => c.budgetAmount > 0);
        const unbudgeted = section.categories.filter((c: any) => c.budgetAmount === 0);
        const rows = showUnbudgeted.has(section.id) ? section.categories : budgeted;

        return (
          <div key={section.id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full grid grid-cols-[1fr_140px_140px_140px] items-center gap-3 px-6 py-3 hover:bg-flourish-hover/20 transition-colors text-left border-b border-flourish-border"
            >
              <div className="flex items-center gap-2">
                <ChevronDown
                  size={16}
                  className={cn("text-flourish-secondary transition-transform", isCollapsed && "-rotate-90")}
                />
                <span className="font-semibold text-flourish-text">{section.name}</span>
              </div>
              <div className="text-right font-semibold text-flourish-text tabular-nums">{formatCurrency(t.budget)}</div>
              <div className="text-right font-semibold text-flourish-text tabular-nums">{formatCurrency(t.actual)}</div>
              <RemainingPill value={remaining} />
            </button>

            {/* Category rows */}
            {!isCollapsed && (
              <>
                {rows.length === 0 && (
                  <div className="px-6 py-4 text-xs text-flourish-muted italic border-b border-flourish-border">
                    No categories yet. Click &ldquo;Add category&rdquo; below to get started.
                  </div>
                )}
                {rows.map((cat: any) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    updateBudgetTarget={updateBudgetTarget}
                    onDelete={() => deleteBudgetCategory(cat.id)}
                  />
                ))}

                <div className="flex items-center gap-3 px-6 py-2 border-b border-flourish-border">
                  <button
                    onClick={() => onAddCategory(sectionKeyMap[section.id] || section.type)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-flourish-orange hover:bg-orange-50 rounded-md transition-colors"
                  >
                    <Plus size={12} /> Add category
                  </button>

                  {unbudgeted.length > 0 && (
                    <button
                      onClick={() => toggleUnbudgeted(section.id)}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-flourish-secondary hover:text-flourish-dark hover:bg-flourish-hover rounded-md transition-colors"
                    >
                      <Eye size={12} />
                      {showUnbudgeted.has(section.id)
                        ? `Hide ${unbudgeted.length} unbudgeted`
                        : `Show ${unbudgeted.length} unbudgeted`}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Bottom total row */}
      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center gap-3 px-6 py-3 bg-flourish-bg/40 border-b border-flourish-border">
        <div className="font-semibold text-flourish-text">{totalLabel}</div>
        <div className="text-right font-semibold text-flourish-text tabular-nums">{formatCurrency(totals.budget)}</div>
        <div className="text-right font-semibold text-flourish-text tabular-nums">{formatCurrency(totals.actual)}</div>
        <RemainingPill value={totals.remaining} />
      </div>
    </div>
  );
}

// =============================================================================
// Category Row
// =============================================================================

function CategoryRow({
  category,
  updateBudgetTarget,
  onDelete,
}: {
  category: any;
  updateBudgetTarget: (id: string, amount: number) => Promise<void>;
  onDelete?: () => void;
}) {
  const [editValue, setEditValue] = useState(category.budgetAmount.toString());
  const [focused, setFocused] = useState(false);

  // Keep local state in sync with data context
  React.useEffect(() => {
    if (!focused) setEditValue(category.budgetAmount.toString());
  }, [category.budgetAmount, focused]);

  const remaining = category.budgetAmount - category.actualAmount;
  const progress = category.budgetAmount > 0 ? category.actualAmount / category.budgetAmount : 0;
  const isOver = category.actualAmount > category.budgetAmount;
  const isNear = !isOver && progress >= 0.8;

  const save = () => {
    const n = parseFloat(editValue);
    if (!isNaN(n) && n !== category.budgetAmount) {
      updateBudgetTarget(category.id, n);
    }
  };

  // Progress bar color
  const barColor = category.budgetAmount === 0
    ? "#E5E5E5"
    : isOver
    ? "#E03131"
    : isNear
    ? "#F59E0B"
    : "#22C55E";
  const barWidth = category.budgetAmount === 0 ? 0 : Math.min(progress, 1) * 100;

  return (
    <div className="border-b border-flourish-border group">
      <div className="grid grid-cols-[1fr_140px_140px_140px] items-center gap-3 px-6 py-2.5 hover:bg-flourish-hover/20 transition-colors">
        {/* Category */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{category.emoji}</span>
          <span className="text-sm text-flourish-text truncate">{category.name}</span>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm(`Delete budget for "${category.name}"?`)) onDelete();
              }}
              className="ml-auto p-1 rounded text-flourish-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete budget"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Budget (editable) */}
        <div className="flex justify-end">
          <input
            type="text"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); save(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setEditValue(category.budgetAmount.toString());
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-full max-w-[120px] px-2.5 py-1 text-sm text-right tabular-nums rounded-md border border-flourish-border bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
          />
        </div>

        {/* Actual */}
        <div className="text-right text-sm tabular-nums text-flourish-secondary">
          {formatCurrency(category.actualAmount)}
        </div>

        {/* Remaining pill */}
        <div className="flex justify-end">
          <RemainingPill value={remaining} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-flourish-bg relative mx-6 mb-0.5">
        <div
          className="h-full transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Remaining Pill (color-coded)
// =============================================================================

function RemainingPill({ value }: { value: number }) {
  if (value === 0) {
    return (
      <div className="flex justify-end">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tabular-nums bg-flourish-bg text-flourish-secondary">
          $0
        </span>
      </div>
    );
  }
  const isNeg = value < 0;
  return (
    <div className="flex justify-end">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
          isNeg ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

// =============================================================================
// Sidebar Section — shown in right panel
// =============================================================================

function SidebarSection({
  title,
  totals,
  color,
}: {
  title: string;
  totals: { budget: number; actual: number; remaining?: number };
  color: "emerald" | "red";
}) {
  const budget = totals.budget;
  const actual = totals.actual;
  const remaining = budget - actual;
  const progress = budget > 0 ? Math.min(actual / budget, 1) * 100 : 0;

  const barColor = color === "emerald" ? "#22C55E" : actual > budget ? "#E03131" : "#F59E0B";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-flourish-dark">{title}</span>
        <span className="text-flourish-secondary tabular-nums">{formatCurrency(budget)} budget</span>
      </div>
      <div className="h-1.5 bg-flourish-bg rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: barColor }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-flourish-muted tabular-nums">{formatCurrency(actual)} spent</span>
        <span className={cn("tabular-nums font-medium", remaining >= 0 ? "text-emerald-700" : "text-red-700")}>
          {formatCurrency(Math.abs(remaining))} {remaining >= 0 ? "remaining" : "over"}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Add Category Modal
// =============================================================================

const EMOJI_OPTIONS = [
  "💵", "💰", "💳", "🏠", "🚗", "🍽", "🛒", "☕️", "🎬", "💪",
  "✈️", "🏥", "📚", "🎮", "🐾", "🛍", "⚡️", "🌐", "📱", "💊",
  "🎓", "🏋️", "🧘", "💄", "🏖", "🚇", "⛽", "📦", "🎨", "🎁",
];

function AddCategoryModal({
  section,
  onSave,
  onClose,
}: {
  section: "income" | "fixed" | "flexible" | "nonMonthly";
  onSave: (meta: { name: string; emoji: string; section: typeof section }, amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(section === "income" ? "💵" : "💰");
  const [amount, setAmount] = useState("");
  const [sec, setSec] = useState<typeof section>(section);
  const [saving, setSaving] = useState(false);

  const SECTION_LABELS: Record<string, string> = {
    income: "Income",
    fixed: "Fixed",
    flexible: "Flexible",
    nonMonthly: "Non-Monthly",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(
      { name: name.trim(), emoji, section: sec },
      parseFloat(amount) || 0
    );
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-flourish-border">
          <h2 className="font-display text-xl font-bold text-flourish-dark">New budget category</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Category name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              placeholder="e.g., Travel, Pet Supplies, Paycheck"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Section</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["income", "fixed", "flexible", "nonMonthly"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSec(s)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs font-medium transition-colors",
                    sec === s
                      ? "bg-flourish-orange text-white"
                      : "bg-flourish-bg text-flourish-secondary hover:bg-flourish-hover"
                  )}
                >
                  {SECTION_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">
              Monthly budget {sec === "income" ? "(expected income)" : "(spending limit)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-flourish-muted">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
              />
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-2">Icon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "p-2 rounded-lg text-lg transition-all",
                    emoji === e ? "bg-flourish-orange/10 ring-2 ring-flourish-orange" : "hover:bg-flourish-hover"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-flourish-dark border border-flourish-border rounded-xl hover:bg-flourish-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-flourish-orange rounded-xl hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
