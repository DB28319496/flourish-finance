'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ArrowRight, ArrowLeft, Building2, Wallet, Target,
  Sparkles, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { PlaidLinkButton } from '@/components/plaid-link-button';
import { cn } from '@/lib/utils';
import { useModal } from '@/lib/use-modal';

interface Step {
  title: string;
  body: string;
  icon: React.ComponentType<any>;
  accent: string;
  action?: { label: string; href?: string };
  highlight?: string; // Optional body text to highlight
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Flourish',
    body: "Your personal financial advisor — combining the rigor of a CFA, CPA, and CFP with an AI that actually takes action. Let's get you set up in under 2 minutes.",
    icon: Sparkles,
    accent: 'from-flourish-orange to-orange-400',
  },
  {
    title: 'Connect your first account',
    body: 'Link your bank, credit cards, or brokerage securely via Plaid. Everything stays private — Flourish can only read transaction data.',
    icon: Building2,
    accent: 'from-blue-500 to-blue-400',
    highlight: "You can also add manual accounts for real estate, crypto, or anything else Plaid can't see.",
  },
  {
    title: 'Track income & spending',
    body: 'Transactions auto-import and categorize themselves. Customize categories, create rules, split transactions, and mark transfers — your data, your rules.',
    icon: TrendingUp,
    accent: 'from-emerald-500 to-emerald-400',
    action: { label: 'See Transactions', href: '/transactions' },
  },
  {
    title: 'Set a budget that works',
    body: 'Add budget categories for anything — fixed bills, flexible spending, savings goals. We compare against real spending automatically, with color-coded progress.',
    icon: Wallet,
    accent: 'from-purple-500 to-purple-400',
    action: { label: 'Open Budget', href: '/budget' },
  },
  {
    title: 'Save toward your goals',
    body: 'Emergency fund, vacation, home down payment — track progress with real deadlines and monthly contributions. Flourish tells you if you\'re on pace.',
    icon: Target,
    accent: 'from-amber-500 to-amber-400',
    action: { label: 'View Goals', href: '/goals' },
  },
  {
    title: 'Meet Flourish AI',
    body: "Ask it anything. Tell it to do things. It has CFA-level investment knowledge, CPA-level tax insight, and can take actions on your behalf — create goals, set budgets, find tax-loss opportunities, audit subscriptions.",
    icon: Sparkles,
    accent: 'from-flourish-orange to-flourish-coral',
    highlight: 'Try: "Add a $15,000 emergency fund goal by December" or "Find tax-loss harvesting opportunities"',
  },
  {
    title: "You're all set",
    body: "Flourish works best with a few accounts connected. Let's link your first one to get started, or explore the demo first.",
    icon: CheckCircle2,
    accent: 'from-emerald-500 to-flourish-green',
  },
];

export function OnboardingTour({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { linkedItems, updateUserSetting } = useData();

  useModal(open ? onComplete : null);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    await updateUserSetting('onboardingCompleted', true);
    onComplete();
  };

  const skip = async () => {
    await updateUserSetting('onboardingCompleted', true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button
          onClick={skip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
          title="Skip tour"
        >
          <X size={18} className="text-flourish-secondary" />
        </button>

        {/* Header with gradient icon */}
        <div className="pt-10 px-8 pb-2">
          <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6", current.accent)}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          <h2 className="font-display text-2xl font-bold text-flourish-dark mb-2 tracking-tight">
            {current.title}
          </h2>
          <p className="text-flourish-secondary text-[15px] leading-relaxed">
            {current.body}
          </p>

          {current.highlight && (
            <div className="mt-4 p-3 rounded-xl bg-flourish-orange/5 border border-flourish-orange/20">
              <p className="text-sm text-flourish-dark italic">{current.highlight}</p>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="px-8 pt-4 pb-6 space-y-3">
          {isLast && (
            <div className="flex flex-col gap-2">
              <PlaidLinkButton className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-flourish-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors" />
              <button
                onClick={finish}
                className="w-full py-3 text-sm font-medium text-flourish-secondary hover:text-flourish-dark transition-colors"
              >
                Skip for now — explore the app
              </button>
            </div>
          )}

          {!isLast && current.action && (
            <button
              onClick={async () => {
                await updateUserSetting('onboardingCompleted', true);
                router.push(current.action!.href || '/');
                onComplete();
              }}
              className="w-full py-3 rounded-xl border border-flourish-border text-sm font-medium text-flourish-dark hover:bg-flourish-hover transition-colors"
            >
              {current.action.label}
            </button>
          )}
        </div>

        {/* Footer: dots + nav */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-flourish-border bg-flourish-bg/30">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-flourish-orange" : "w-1.5 bg-flourish-border"
                )}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-flourish-hover transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            {!isLast && (
              <button
                onClick={next}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-flourish-orange text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Next
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
