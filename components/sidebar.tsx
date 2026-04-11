'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
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
  Search,
  Bell,
  Settings,
  PanelLeft,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/accounts', label: 'Accounts', icon: Layers },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/cash-flow', label: 'Cash Flow', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: Clock },
  { href: '/budget', label: 'Budget', icon: Wallet },
  { href: '/recurring', label: 'Recurring', icon: CalendarRange },
  { href: '/goals', label: 'Goals', icon: Target, badge: 'BETA' },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/advice', label: 'Advice', icon: ThumbsUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] min-w-[280px] bg-[#fdf8f4] h-screen flex flex-col">
      {/* Header: Logo + Action Icons */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-flourish-orange">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 4C18 4 22 8 26 8C30 8 32 12 30 16C28 20 24 20 22 18C20 16 18 12 18 12C18 12 16 16 14 18C12 20 8 20 6 16C4 12 6 8 10 8C14 8 18 4 18 4Z" fill="currentColor" />
              <path d="M18 12C18 12 20 16 22 18C24 20 24 24 22 28C20 32 16 32 14 28C12 24 12 20 14 18C16 16 18 12 18 12Z" fill="currentColor" opacity="0.7" />
            </svg>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors">
              <Search size={18} />
            </button>
            <button className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors">
              <Bell size={18} />
            </button>
            <button className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors">
              <Settings size={18} />
            </button>
            <button className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors">
              <PanelLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#f0e8e0] text-flourish-dark'
                      : 'text-flourish-secondary hover:bg-[#f0e8e0]/50 hover:text-flourish-dark'
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isActive
                        ? 'text-flourish-dark'
                        : 'text-flourish-secondary group-hover:text-flourish-dark'
                    }`}
                  />

                  <span
                    className={`text-[15px] transition-colors duration-200 flex-1 ${
                      isActive
                        ? 'font-semibold text-flourish-dark'
                        : 'font-medium text-flourish-secondary group-hover:text-flourish-dark'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="text-[10px] font-semibold tracking-wider text-flourish-secondary bg-[#e8ddd4] px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="px-5 pb-5 space-y-4">
        {/* Free Trial */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-flourish-dark">Free trial</span>
            <span className="text-sm text-flourish-secondary">7 days left</span>
          </div>
          <div className="h-1.5 bg-[#e8ddd4] rounded-full overflow-hidden">
            <div className="h-full w-[70%] bg-emerald-500 rounded-full" />
          </div>
        </div>

        {/* AI Assistant */}
        <button className="flex items-center gap-2 text-flourish-orange hover:opacity-80 transition-opacity">
          <Sparkles size={18} />
          <span className="text-sm font-semibold">AI Assistant</span>
        </button>
      </div>
    </aside>
  );
}
