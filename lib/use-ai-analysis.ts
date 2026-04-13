"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import { useData } from "./data-context";

type AnalysisType = "weekly-brief" | "portfolio-analysis" | "tax-opportunities" | "subscription-audit";

interface CachedAnalysis<T> {
  analysis: T;
  generatedAt: string;
}

const CACHE_TTL_MS: Record<AnalysisType, number> = {
  "weekly-brief": 24 * 60 * 60 * 1000, // 24 hours
  "portfolio-analysis": 6 * 60 * 60 * 1000, // 6 hours
  "tax-opportunities": 24 * 60 * 60 * 1000,
  "subscription-audit": 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * useAIAnalysis — fetches a structured AI analysis, cached in localStorage.
 * Auto-loads on mount if no cached result. Call `refresh()` to force regenerate.
 */
export function useAIAnalysis<T = any>(type: AnalysisType): {
  analysis: T | null;
  generatedAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user, getIdToken } = useAuth();
  const { rawTransactions, accounts, holdingGroups, goals, budgetTargets, rules } = useData() as any;

  const [analysis, setAnalysis] = useState<T | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = user ? `flourish_ai_${type}_${user.uid}` : null;

  // Load from cache on mount
  useEffect(() => {
    if (!cacheKey) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const cached: CachedAnalysis<T> = JSON.parse(raw);
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < CACHE_TTL_MS[type]) {
        setAnalysis(cached.analysis);
        setGeneratedAt(cached.generatedAt);
      }
    } catch {
      // Ignore malformed cache
    }
  }, [cacheKey, type]);

  const refresh = useCallback(async () => {
    if (!user) {
      setError("Please sign in");
      return;
    }
    const token = await getIdToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Build a focused financial context based on the analysis type
      const context = buildContext(type, { rawTransactions, accounts, holdingGroups, goals, budgetTargets, rules });

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, financialContext: context }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setGeneratedAt(data.generatedAt);

      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify({ analysis: data.analysis, generatedAt: data.generatedAt }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate analysis");
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken, type, cacheKey, rawTransactions, accounts, holdingGroups, goals, budgetTargets, rules]);

  return { analysis, generatedAt, loading, error, refresh };
}

// Build a focused context string for each analysis type
function buildContext(
  type: AnalysisType,
  data: { rawTransactions: any[]; accounts: any[]; holdingGroups: any[]; goals: any[]; budgetTargets: Record<string, number>; rules: any[] }
): string {
  const { rawTransactions, accounts, holdingGroups, goals, budgetTargets } = data;

  const totalAssets = accounts
    .filter((a) => a.type !== "credit" && a.type !== "loan")
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const totalLiabilities = accounts
    .filter((a) => a.type === "credit" || a.type === "loan")
    .reduce((sum, a) => sum + (a.current_balance || 0), 0);

  // Common header
  const header = `
Net Worth: $${(totalAssets - totalLiabilities).toFixed(2)}
Assets: $${totalAssets.toFixed(2)}  |  Liabilities: $${totalLiabilities.toFixed(2)}

Accounts:
${accounts.map((a) => `- ${a.name}${a.mask ? ` ...${a.mask}` : ""} [${a.type}]: $${(a.current_balance || 0).toFixed(2)}`).join("\n")}
`.trim();

  switch (type) {
    case "weekly-brief": {
      // Last 7 days of transactions
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const weekTxs = rawTransactions.filter((t) => t.date >= weekAgo);
      const prevWeekAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const prevWeekTxs = rawTransactions.filter((t) => t.date >= prevWeekAgo && t.date < weekAgo);

      const weekSpend = weekTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const prevWeekSpend = prevWeekTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

      const byCategoryThisWeek: Record<string, number> = {};
      for (const tx of weekTxs.filter((t) => t.amount > 0)) {
        const c = tx.category?.[0] || "Other";
        byCategoryThisWeek[c] = (byCategoryThisWeek[c] || 0) + tx.amount;
      }

      return `${header}

This week (${weekTxs.length} txs, $${weekSpend.toFixed(2)} spent):
${Object.entries(byCategoryThisWeek).sort(([, a], [, b]) => b - a).slice(0, 8).map(([c, a]) => `- ${c}: $${a.toFixed(2)}`).join("\n")}

Previous week: ${prevWeekTxs.length} transactions, $${prevWeekSpend.toFixed(2)} spent
Week-over-week change: ${prevWeekSpend > 0 ? (((weekSpend - prevWeekSpend) / prevWeekSpend) * 100).toFixed(1) : "n/a"}%

All transactions this week:
${weekTxs.slice(0, 40).map((t) => `- ${t.date}: ${t.merchant_name || t.name} ${t.amount > 0 ? "-" : "+"}$${Math.abs(t.amount).toFixed(2)} [${t.category?.[0] || "Other"}]`).join("\n")}

Active goals:
${goals.map((g) => `- ${g.name}: $${g.current}/$${g.target} (${((g.current / (g.target || 1)) * 100).toFixed(0)}%)`).join("\n") || "(none)"}

Budget targets vs actuals:
${Object.entries(budgetTargets).slice(0, 10).map(([cat, target]) => {
  const actual = byCategoryThisWeek[cat] || 0;
  return `- ${cat}: target $${target}/mo, spent $${actual.toFixed(2)} so far`;
}).join("\n") || "(none)"}
`.trim();
    }

    case "portfolio-analysis": {
      const holdings = holdingGroups.flatMap((g) => g.holdings.map((h: any) => ({ ...h, account: g.accountName })));
      const totalValue = holdings.reduce((s: number, h: any) => s + h.value, 0);
      return `${header}

Investment Holdings (${holdings.length} positions, $${totalValue.toFixed(2)} total):
${holdings.map((h: any) => `- ${h.ticker} (${h.name}) in ${h.account}: ${h.quantity.toFixed(4)} shares, $${h.value.toFixed(2)} market value, $${(h.costBasis || 0).toFixed(2)} cost basis${h.costBasis > 0 ? ` (${(((h.value - h.costBasis) / h.costBasis) * 100).toFixed(1)}% return)` : ""}`).join("\n")}

Allocation by position (% of portfolio):
${holdings.sort((a: any, b: any) => b.value - a.value).slice(0, 10).map((h: any) => `- ${h.ticker}: ${((h.value / (totalValue || 1)) * 100).toFixed(1)}%`).join("\n")}
`.trim();
    }

    case "tax-opportunities": {
      const holdings = holdingGroups.flatMap((g) => g.holdings.map((h: any) => ({ ...h, account: g.accountName })));
      const lossPositions = holdings.filter((h: any) => h.costBasis > 0 && h.value < h.costBasis);

      return `${header}

All Holdings with cost basis:
${holdings.filter((h: any) => h.costBasis > 0).map((h: any) => {
  const loss = h.value - h.costBasis;
  const pct = (loss / h.costBasis) * 100;
  return `- ${h.ticker} in ${h.account}: ${h.quantity} shares, $${h.value.toFixed(2)} current, $${h.costBasis.toFixed(2)} cost basis, unrealized ${loss >= 0 ? "gain" : "LOSS"} $${loss.toFixed(2)} (${pct.toFixed(1)}%)`;
}).join("\n")}

Positions at a loss (${lossPositions.length}):
${lossPositions.map((h: any) => `- ${h.ticker}: $${(h.value - h.costBasis).toFixed(2)} unrealized loss`).join("\n") || "(none)"}
`.trim();
    }

    case "subscription-audit": {
      return `${header}

Last 90 days of transactions (for recurring pattern analysis):
${rawTransactions.slice(0, 120).map((t) => `- ${t.date}: ${t.merchant_name || t.name} ${t.amount > 0 ? "-" : "+"}$${Math.abs(t.amount).toFixed(2)} [${t.category?.[0] || "Other"}]`).join("\n")}
`.trim();
    }

    default:
      return header;
  }
}
