"use client";

import { useState, useEffect, useCallback } from "react";

export interface Quote {
  symbol: string;
  name: string;
  price: number | null;
  change: number;
  changePercent: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  currency?: string;
  exchange?: string;
  marketState?: string;
}

export interface HistoryPoint {
  time: number;
  date: string;
  close: number;
}

export interface HistoryData {
  symbol: string;
  range: string;
  points: HistoryPoint[];
  summary: {
    first: number | null;
    last: number | null;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  };
}

export interface NewsArticle {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  thumbnail?: string;
  relatedSymbols: string[];
}

/**
 * useQuotes — fetches live prices for a list of tickers.
 * Re-fetches every 60s while the component is mounted.
 */
export function useQuotes(symbols: string[]): {
  quotes: Record<string, Quote>;
  loading: boolean;
  error: string | null;
} {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = symbols.sort().join(",");

  useEffect(() => {
    if (symbols.length === 0) return;

    let cancelled = false;
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) setQuotes(data.quotes || {});
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading, error };
}

/**
 * useHistory — fetches historical candles for one symbol.
 */
export function useHistory(
  symbol: string | null,
  range: string = "3mo"
): { data: HistoryData | null; loading: boolean } {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      return;
    }
    let cancelled = false;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const result = await res.json();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  return { data, loading };
}

/**
 * useNews — fetches recent news for a list of tickers.
 */
export function useNews(symbols: string[]): {
  articles: NewsArticle[];
  loading: boolean;
} {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const key = symbols.sort().join(",");

  useEffect(() => {
    if (symbols.length === 0) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/news?symbols=${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) setArticles(data.articles || []);
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNews();
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { articles, loading };
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
