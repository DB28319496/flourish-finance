'use client';

import React from 'react';
import { AlertTriangle, TrendingUp, CreditCard, PiggyBank, CheckCircle2, X, Bell } from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { ComputedNotification } from '@/lib/compute-finance';

// Map icon name strings to components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard, AlertTriangle, TrendingUp, PiggyBank, CheckCircle2, Bell,
};

// Fallback notifications for unauthenticated users
const fallbackNotifications = [
  { id: 1, iconName: 'CreditCard', iconBg: 'bg-red-50', iconColor: 'text-red-500', title: 'Large transaction detected', description: 'A $1,250 charge at Best Buy was posted to your Chase Sapphire.', time: '2 hours ago', unread: true },
  { id: 2, iconName: 'AlertTriangle', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', title: 'Budget limit approaching', description: 'You\'ve used 92% of your Dining Out budget for April.', time: '5 hours ago', unread: true },
  { id: 3, iconName: 'TrendingUp', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', title: 'Portfolio up 2.3% this week', description: 'Your investments gained $2,580 in the past 7 days.', time: '1 day ago', unread: false },
  { id: 4, iconName: 'PiggyBank', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', title: 'Emergency Fund milestone', description: 'You\'ve reached 70% of your emergency fund goal!', time: '2 days ago', unread: false },
  { id: 5, iconName: 'CheckCircle2', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', title: 'Bill paid successfully', description: 'Your rent payment of $1,800 was processed.', time: '3 days ago', unread: false },
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
