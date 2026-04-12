"use client";

import React, { useState } from "react";
import { Card, ProgressBar, SectionHeader } from "@/components/ui";
import { formatCurrency } from "@/lib/mock-data";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Budget Page
// =============================================================================

export default function BudgetPage() {
  const [month, setMonth] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["income", "fixed", "flex", "nonmo"])
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showUnbudgeted, setShowUnbudgeted] = useState<Set<string>>(new Set());

  const { budgetSections, updateBudgetTarget } = useData();

  // Month navigation
  const monthStr = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setMonth(new Date());
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setExpandedSections(newSet);
  };

  // Inline editing for budget amounts
  const startEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(currentValue.toString());
  };

  const finishEdit = () => {
    if (editingId && editValue) {
      const amount = parseFloat(editValue);
      if (!isNaN(amount)) {
        updateBudgetTarget(editingId, amount);
      }
    }
    setEditingId(null);
  };

  const toggleUnbudgeted = (sectionId: string) => {
    const newSet = new Set(showUnbudgeted);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setShowUnbudgeted(newSet);
  };

  // Calculate totals
  const calculateSectionTotals = (section: typeof budgetSections[0]) => {
    return {
      budget: section.categories.reduce((sum, cat) => sum + cat.budgetAmount, 0),
      actual: section.categories.reduce((sum, cat) => sum + cat.actualAmount, 0),
    };
  };

  const calculateAllTotals = () => {
    const allBudget = budgetSections.reduce((sum, sec) => {
      const totals = calculateSectionTotals(sec);
      return sum + totals.budget;
    }, 0);
    const allActual = budgetSections.reduce((sum, sec) => {
      const totals = calculateSectionTotals(sec);
      return sum + totals.actual;
    }, 0);
    return { allBudget, allActual };
  };

  const { allBudget, allActual } = calculateAllTotals();
  const leftToBudget = allBudget - allActual;

  // Render category row
  const renderCategoryRow = (category: any, sectionId: string) => {
    const remaining = category.budgetAmount - category.actualAmount;
    const progress =
      category.budgetAmount > 0
        ? category.actualAmount / category.budgetAmount
        : 0;
    const isOverBudget = category.actualAmount > category.budgetAmount;
    const isEditing = editingId === category.id;

    return (
      <div
        key={category.id}
        className="border-b border-flourish-bg last:border-b-0"
      >
        {/* Category row */}
        <div className="flex items-center gap-4 px-6 py-4 hover:bg-flourish-bg/30 transition-colors">
          {/* Category name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{category.emoji}</span>
            <span className="text-sm font-medium text-flourish-text truncate">
              {category.name}
            </span>
          </div>

          {/* Budget column */}
          <div className="w-24 text-right">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEdit();
                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                autoFocus
                className="w-full bg-flourish-bg rounded px-2 py-1 text-sm text-right text-flourish-text border border-flourish-tertiary/20"
              />
            ) : (
              <button
                onClick={() => startEdit(category.id, category.budgetAmount)}
                className="text-sm text-flourish-text hover:bg-flourish-bg rounded px-2 py-1 transition-colors"
              >
                {formatCurrency(category.budgetAmount)}
              </button>
            )}
          </div>

          {/* Actual column */}
          <div className="w-24 text-right text-sm text-flourish-secondary">
            {formatCurrency(category.actualAmount)}
          </div>

          {/* Remaining column */}
          <div
            className={cn(
              "w-24 text-right text-sm font-medium",
              isOverBudget ? "text-flourish-red" : "text-flourish-green"
            )}
          >
            {formatCurrency(remaining)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-3">
          <ProgressBar progress={progress} height={3} />
        </div>
      </div>
    );
  };

  // Render budget section
  const renderSection = (section: typeof budgetSections[0]) => {
    const isExpanded = expandedSections.has(section.id);
    const totals = calculateSectionTotals(section);
    const showUnbudgetedForSection = showUnbudgeted.has(section.id);

    // Filter unbudgeted items (those with budgetAmount = 0)
    const unbudgetedCategories = section.categories.filter(
      (cat) => cat.budgetAmount === 0
    );
    const budgetedCategories = section.categories.filter(
      (cat) => cat.budgetAmount > 0
    );
    const categoriesToShow = showUnbudgetedForSection
      ? section.categories
      : budgetedCategories;

    return (
      <div
        key={section.id}
        className="border border-flourish-bg rounded-flourish overflow-hidden"
      >
        {/* Section header */}
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between bg-white px-6 py-4 hover:bg-flourish-bg/20 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="text-flourish-secondary">
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </div>
            <span className="font-semibold text-flourish-text">
              {section.name}
            </span>
          </div>
        </button>

        {/* Column headers - only show when expanded */}
        {isExpanded && (
          <div className="flex items-center gap-4 px-6 py-3 bg-flourish-bg/50 border-t border-flourish-bg text-xs font-semibold uppercase tracking-wider text-flourish-tertiary">
            <div className="flex-1">Category</div>
            <div className="w-24 text-right">Budget</div>
            <div className="w-24 text-right">Actual</div>
            <div className="w-24 text-right">Remaining</div>
          </div>
        )}

        {/* Category rows */}
        {isExpanded && (
          <>
            {categoriesToShow.map((category) =>
              renderCategoryRow(category, section.id)
            )}

            {/* Show unbudgeted link */}
            {unbudgetedCategories.length > 0 && (
              <div className="px-6 py-3 border-t border-flourish-bg">
                <button
                  onClick={() => toggleUnbudgeted(section.id)}
                  className="text-xs font-medium text-flourish-orange hover:underline"
                >
                  {showUnbudgetedForSection
                    ? `Hide ${unbudgetedCategories.length} unbudgeted`
                    : `Show ${unbudgetedCategories.length} unbudgeted`}
                </button>
              </div>
            )}

            {/* Section total row */}
            <div className="flex items-center gap-4 px-6 py-4 bg-flourish-bg/30 border-t border-flourish-bg font-semibold text-flourish-text">
              <div className="flex-1">Total</div>
              <div className="w-24 text-right">
                {formatCurrency(totals.budget)}
              </div>
              <div className="w-24 text-right">
                {formatCurrency(totals.actual)}
              </div>
              <div
                className={cn(
                  "w-24 text-right",
                  totals.actual > totals.budget
                    ? "text-flourish-red"
                    : "text-flourish-green"
                )}
              >
                {formatCurrency(totals.budget - totals.actual)}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Month Navigation Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-flourish-text">Budget</h1>
          <Link
            href="/settings"
            title="Settings"
            className="p-2 hover:bg-flourish-bg rounded-flourish transition-colors"
          >
            <Settings size={20} className="text-flourish-secondary" />
          </Link>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-flourish-bg rounded-flourish transition-colors"
            >
              <ChevronLeft size={20} className="text-flourish-secondary" />
            </button>
            <span className="min-w-[200px] text-center font-medium text-flourish-text">
              {monthStr}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-flourish-bg rounded-flourish transition-colors"
            >
              <ChevronRight size={20} className="text-flourish-secondary" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-flourish-secondary hover:text-flourish-text hover:bg-flourish-bg rounded-flourish transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Main content grid: Budget table (70%) + Summary (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Budget Sections */}
        <div className="space-y-4">
          {budgetSections.map((section) => renderSection(section))}
        </div>

        {/* Summary Panel */}
        <div className="space-y-4">
          {/* Left to budget pill */}
          <div className="bg-flourish-green rounded-flourish-lg p-6 text-white">
            <p className="text-xs uppercase font-semibold tracking-wider mb-1 opacity-90">
              Left to Budget
            </p>
            <p className="text-3xl font-bold font-mono">
              {formatCurrency(leftToBudget)}
            </p>
          </div>

          {/* Section breakdown */}
          <Card className="space-y-4">
            <SectionHeader title="Breakdown" />
            <div className="space-y-3">
              {budgetSections.map((section) => {
                const totals = calculateSectionTotals(section);
                const progress =
                  totals.budget > 0 ? totals.actual / totals.budget : 0;

                return (
                  <div key={section.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-flourish-text">
                        {section.name}
                      </span>
                      <span className="text-flourish-secondary">
                        {formatCurrency(totals.actual)} /{" "}
                        {formatCurrency(totals.budget)}
                      </span>
                    </div>
                    <ProgressBar progress={progress} height={3} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
