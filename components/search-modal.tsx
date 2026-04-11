'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Layers,
  CreditCard,
  BarChart3,
  Clock,
  Wallet,
  CalendarRange,
  Target,
  TrendingUp,
  ThumbsUp,
  Settings,
  X,
} from 'lucide-react';

const pages = [
  { href: '/', label: 'Dashboard', icon: Home, keywords: ['home', 'overview'] },
  { href: '/accounts', label: 'Accounts', icon: Layers, keywords: ['bank', 'balance', 'net worth'] },
  { href: '/transactions', label: 'Transactions', icon: CreditCard, keywords: ['payments', 'spending', 'purchases'] },
  { href: '/cash-flow', label: 'Cash Flow', icon: BarChart3, keywords: ['income', 'expenses', 'money'] },
  { href: '/reports', label: 'Reports', icon: Clock, keywords: ['analytics', 'charts', 'summary'] },
  { href: '/budget', label: 'Budget', icon: Wallet, keywords: ['plan', 'limit', 'categories'] },
  { href: '/recurring', label: 'Recurring', icon: CalendarRange, keywords: ['subscriptions', 'bills', 'autopay'] },
  { href: '/goals', label: 'Goals', icon: Target, keywords: ['savings', 'targets', 'milestones'] },
  { href: '/investments', label: 'Investments', icon: TrendingUp, keywords: ['portfolio', 'stocks', 'returns'] },
  { href: '/advice', label: 'Advice', icon: ThumbsUp, keywords: ['tips', 'insights', 'recommendations'] },
  { href: '/settings', label: 'Settings', icon: Settings, keywords: ['preferences', 'profile', 'account'] },
];

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = query.trim()
    ? pages.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.label.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.includes(q))
        );
      })
    : pages;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-flourish-border">
          <Search size={20} className="text-flourish-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base text-flourish-dark placeholder-flourish-secondary bg-transparent outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-md hover:bg-flourish-hover transition-colors">
            <X size={16} className="text-flourish-secondary" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-flourish-secondary text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  key={page.href}
                  onClick={() => navigate(page.href)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#fdf8f4] transition-colors"
                >
                  <Icon size={18} className="text-flourish-secondary flex-shrink-0" />
                  <span className="text-sm font-medium text-flourish-dark">{page.label}</span>
                  <span className="ml-auto text-xs text-flourish-secondary">{page.href}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-flourish-border bg-[#fdf8f4]">
          <p className="text-xs text-flourish-secondary">
            <kbd className="px-1.5 py-0.5 bg-white border border-flourish-border rounded text-[10px] font-mono">ESC</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
