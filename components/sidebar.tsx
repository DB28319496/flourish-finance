'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  BarChart3,
  FileBarChart,
  PieChart,
  Repeat,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Building2 },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/cash-flow', label: 'Cash Flow', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/budget', label: 'Budget', icon: PieChart },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-[260px] bg-white border-r border-flourish-border fixed left-0 top-0 h-screen flex flex-col">
      {/* Logo Section */}
      <div className="px-6 py-8 border-b border-flourish-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-flourish-orange flex items-center justify-center">
            <span className="text-white font-fraunces text-lg font-bold">🌿</span>
          </div>
          <h1 className="font-fraunces text-xl font-bold text-flourish-dark">
            Flourish
          </h1>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-flourish-cream text-flourish-orange'
                      : 'text-flourish-secondary hover:bg-flourish-cream/50'
                  }`}
                >
                  {/* Left border accent for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-flourish-orange rounded-r" />
                  )}

                  {/* Icon */}
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isActive
                        ? 'text-flourish-orange'
                        : 'text-flourish-secondary group-hover:text-flourish-orange'
                    }`}
                  />

                  {/* Label */}
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-flourish-orange font-dm-sans'
                        : 'text-flourish-secondary group-hover:text-flourish-orange font-dm-sans'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="px-4 py-6 border-t border-flourish-border">
        {user ? (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flourish-orange to-flourish-orange/70 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-dm-sans font-semibold">
                {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-flourish-dark font-dm-sans truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-flourish-secondary font-dm-sans truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-xs text-flourish-secondary hover:text-flourish-orange transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-flourish-orange text-white text-sm font-medium hover:bg-flourish-orange/90 transition-colors w-full"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
