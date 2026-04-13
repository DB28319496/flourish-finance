'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, CreditCard, PiggyBank, CheckCircle2, X, Bell } from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { ComputedNotification } from '@/lib/compute-finance';

// Map icon name strings to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard, AlertTriangle, TrendingUp, PiggyBank, CheckCircle2, Bell,
};

// Demo notifications for unauthenticated users — signed-in users get real data
const fallbackNotifications = [
  { id: 1, iconName: 'Sparkles', iconBg: 'bg-flourish-orange/10', iconColor: 'text-flourish-orange', title: 'Welcome to Flourish', description: 'Sign in to see real-time notifications about your spending, budgets, and portfolio.', time: 'Just now', unread: true },
  { id: 2, iconName: 'TrendingUp', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', title: 'Demo: spending alert', description: 'Example — when a category crosses 80% of its budget, you\'ll see it here.', time: 'Demo', unread: false },
  { id: 3, iconName: 'PiggyBank', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', title: 'Demo: goal milestone', description: 'Example — when you cross a goal milestone like 50% or 75% funded.', time: 'Demo', unread: false },
];

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const { notifications: computedNotifs, isUsingMockData } = useData();
  const notifications = computedNotifs.length > 0 ? computedNotifs : fallbackNotifications;
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed left-[280px] top-0 z-[95] w-[380px] h-screen bg-white shadow-2xl border-r border-flourish-border flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-flourish-border">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-flourish-dark">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-flourish-orange text-white text-xs font-semibold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-flourish-border">
          <button className="flex-1 py-3 text-sm font-medium text-flourish-orange border-b-2 border-flourish-orange">
            All
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-flourish-secondary hover:text-flourish-dark transition-colors">
            Unread
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.iconName] || Bell;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-5 py-4 border-b border-flourish-border hover:bg-[#fdf8f4] transition-colors cursor-pointer ${
                  notif.unread ? 'bg-orange-50/30' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.iconBg}`}>
                  <Icon size={18} className={notif.iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${notif.unread ? 'font-semibold text-flourish-dark' : 'font-medium text-flourish-dark'}`}>
                      {notif.title}
                    </p>
                    {notif.unread && (
                      <div className="w-2 h-2 rounded-full bg-flourish-orange flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-flourish-secondary mt-1 leading-relaxed">{notif.description}</p>
                  <p className="text-xs text-flourish-secondary/60 mt-1.5">{notif.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-flourish-border">
          <button className="w-full text-center text-sm font-medium text-flourish-orange hover:underline">
            Mark all as read
          </button>
        </div>
      </div>
    </>
  );
}
