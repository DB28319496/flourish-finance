'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
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
import { SearchModal } from './search-modal';
import { NotificationsPanel } from './notifications-panel';

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

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <>
      <aside
        className={`bg-[#fdf8f4] h-screen flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          collapsed ? 'w-[72px] min-w-[72px]' : 'w-[280px] min-w-[280px]'
        }`}
      >
        {/* Header: Logo + Action Icons */}
        <div className={`pt-5 pb-2 ${collapsed ? 'px-3' : 'px-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {/* Logo */}
            <div className="text-flourish-orange flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 4C18 4 22 8 26 8C30 8 32 12 30 16C28 20 24 20 22 18C20 16 18 12 18 12C18 12 16 16 14 18C12 20 8 20 6 16C4 12 6 8 10 8C14 8 18 4 18 4Z" fill="currentColor" />
                <path d="M18 12C18 12 20 16 22 18C24 20 24 24 22 28C20 32 16 32 14 28C12 24 12 20 14 18C16 16 18 12 18 12Z" fill="currentColor" opacity="0.7" />
              </svg>
            </div>

            {/* Action Icons - hidden when collapsed */}
            {!collapsed && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors"
                >
                  <Search size={18} />
                </button>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    notificationsOpen
                      ? 'text-flourish-dark bg-black/5'
                      : 'text-flourish-secondary hover:text-flourish-dark hover:bg-black/5'
                  }`}
                >
                  <Bell size={18} />
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-flourish-orange rounded-full" />
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className={`p-2 rounded-lg transition-colors ${
                    pathname === '/settings'
                      ? 'text-flourish-dark bg-black/5'
                      : 'text-flourish-secondary hover:text-flourish-dark hover:bg-black/5'
                  }`}
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={onToggle}
                  className="p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors"
                >
                  <PanelLeft size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Toggle button when collapsed */}
          {collapsed && (
            <button
              onClick={onToggle}
              className="mt-2 w-full flex justify-center p-2 rounded-lg text-flourish-secondary hover:text-flourish-dark hover:bg-black/5 transition-colors"
            >
              <PanelLeft size={18} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
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
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                      collapsed ? 'px-0 py-2.5 justify-center' : 'px-4 py-2.5'
                    } ${
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

                    {!collapsed && (
                      <>
                        <span
                          className={`text-[15px] transition-colors duration-200 flex-1 whitespace-nowrap ${
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
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className={`pb-5 space-y-4 ${collapsed ? 'px-3' : 'px-5'}`}>
          {!collapsed ? (
            <>
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

              {/* User Profile / Sign In */}
              <div className="pt-3 border-t border-[#e8ddd4]">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-flourish-orange to-flourish-orange/70 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-flourish-dark truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-flourish-secondary truncate">
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
            </>
          ) : (
            <>
              <button
                title="AI Assistant"
                className="w-full flex justify-center text-flourish-orange hover:opacity-80 transition-opacity"
              >
                <Sparkles size={20} />
              </button>
              {user ? (
                <div className="w-full flex justify-center">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-flourish-orange to-flourish-orange/70 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  title="Sign in"
                  className="w-full flex justify-center text-flourish-orange hover:opacity-80 transition-opacity"
                >
                  <Layers size={20} />
                </Link>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Modals & Panels */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
