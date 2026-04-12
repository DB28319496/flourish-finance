'use client';

import { useState } from 'react';
import { User, Bell, Shield, Palette, CreditCard, Link2, LogOut } from 'lucide-react';
import { Card } from '@/components/ui';
import { useData } from '@/lib/data-context';
import { useAuth } from '@/lib/auth-context';
import { PlaidLinkButton } from '@/components/plaid-link-button';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance' | 'billing' | 'connections';

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  { id: 'connections' as const, label: 'Connections', icon: Link2 },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        enabled ? 'bg-flourish-orange' : 'bg-gray-300'
      )}
    >
      <div
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          enabled && 'translate-x-5'
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { userSettings, updateUserSetting, linkedItems, accountGroups, disconnectBank, connectBank } = useData();
  const { user, signOut } = useAuth();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const emailNotifs = userSettings.emailNotifs ?? true;
  const pushNotifs = userSettings.pushNotifs ?? true;
  const weeklyReport = userSettings.weeklyReport ?? false;
  const budgetAlerts = userSettings.budgetAlerts ?? true;
  const largeTransactions = userSettings.largeTransactions ?? true;
  const darkMode = userSettings.darkMode ?? false;

  return (
    <div className="min-h-screen bg-flourish-bg">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-flourish-text">Settings</h1>
          <p className="mt-1 text-flourish-secondary">Manage your account preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-[#f0e8e0] text-flourish-dark'
                      : 'text-flourish-secondary hover:bg-[#f0e8e0]/50 hover:text-flourish-dark'
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}

            {user && (
              <div className="pt-4 border-t border-flourish-border mt-4">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Profile Information</h2>
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-flourish-orange to-flourish-orange/70 flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">
                        {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">{user?.displayName || 'User'}</p>
                      <p className="text-xs text-flourish-secondary">{user?.email || 'Not signed in'}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div>
                    <label className="block text-sm font-medium text-flourish-dark mb-1.5">Display Name</label>
                    <input
                      type="text"
                      defaultValue={userSettings.displayName || user?.displayName || ''}
                      onBlur={(e) => updateUserSetting('displayName', e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-flourish-dark mb-1.5">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-secondary bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-flourish-dark mb-1.5">Currency</label>
                    <select
                      value={userSettings.currency || 'USD'}
                      onChange={(e) => updateUserSetting('currency', e.target.value)}
                      className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (&euro;)</option>
                      <option value="GBP">GBP (&pound;)</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Email Notifications</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Receive updates via email</p>
                    </div>
                    <Toggle enabled={emailNotifs} onChange={() => updateUserSetting('emailNotifs', !emailNotifs)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Push Notifications</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Browser push notifications</p>
                    </div>
                    <Toggle enabled={pushNotifs} onChange={() => updateUserSetting('pushNotifs', !pushNotifs)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Weekly Report</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Get a weekly summary of your finances</p>
                    </div>
                    <Toggle enabled={weeklyReport} onChange={() => updateUserSetting('weeklyReport', !weeklyReport)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Budget Alerts</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Alert when nearing budget limits</p>
                    </div>
                    <Toggle enabled={budgetAlerts} onChange={() => updateUserSetting('budgetAlerts', !budgetAlerts)} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Large Transaction Alerts</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Notify on transactions over $500</p>
                    </div>
                    <Toggle enabled={largeTransactions} onChange={() => updateUserSetting('largeTransactions', !largeTransactions)} />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Security</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Password</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Last changed 30 days ago</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-flourish-orange border border-flourish-orange rounded-lg hover:bg-orange-50 transition-colors">
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Two-Factor Authentication</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-flourish-orange rounded-lg hover:bg-orange-600 transition-colors">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Active Sessions</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">1 active session</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                      Revoke All
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Dark Mode</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Switch to a darker theme</p>
                    </div>
                    <Toggle enabled={darkMode} onChange={() => updateUserSetting('darkMode', !darkMode)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-flourish-dark mb-3">Accent Color</p>
                    <div className="flex gap-3">
                      {['#E5633A', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'].map((color) => (
                        <button
                          key={color}
                          className={cn(
                            'w-10 h-10 rounded-full border-2 transition-transform hover:scale-110',
                            color === '#E5633A' ? 'border-flourish-dark scale-110' : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'billing' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Billing</h2>
                <div className="space-y-6">
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-flourish-dark">Free Trial</p>
                      <span className="text-xs font-medium text-flourish-orange bg-white px-2 py-1 rounded-full">7 days left</span>
                    </div>
                    <p className="text-xs text-flourish-secondary">Your trial ends on April 18, 2026. Upgrade to keep full access.</p>
                    <button className="mt-3 px-4 py-2 text-sm font-medium text-white bg-flourish-orange rounded-lg hover:bg-orange-600 transition-colors">
                      Upgrade to Pro — $9.99/mo
                    </button>
                  </div>

                  <div className="py-3 border-b border-flourish-border">
                    <p className="text-sm font-medium text-flourish-dark">Payment Method</p>
                    <p className="text-xs text-flourish-secondary mt-0.5">No payment method on file</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'connections' && (
              <Card className="p-8 animate-slide-up">
                <h2 className="font-display text-xl font-bold text-flourish-text mb-2">Connected Accounts</h2>
                <p className="text-sm text-flourish-secondary mb-6">
                  {linkedItems.length > 0
                    ? `${linkedItems.length} institution${linkedItems.length > 1 ? 's' : ''} connected via Plaid`
                    : user
                    ? 'No banks connected yet'
                    : 'Sign in to manage your connected accounts'}
                </p>
                <div className="space-y-4">
                  {linkedItems.length > 0 ? (
                    linkedItems.map((item) => {
                      const itemAccounts = accountGroups
                        .flatMap((g) => g.accounts)
                        .filter((a: any) => a.item_id === item.item_id);
                      return (
                        <div key={item.item_id} className="flex items-center justify-between py-3 border-b border-flourish-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-flourish-hover flex items-center justify-center">
                              <span className="text-sm font-bold text-flourish-dark">
                                {item.institution_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-flourish-dark">{item.institution_name}</p>
                              <p className="text-xs text-emerald-500">
                                Connected{itemAccounts.length > 0 ? ` — ${itemAccounts.length} account${itemAccounts.length > 1 ? 's' : ''}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (!confirm(`Disconnect ${item.institution_name}? This will stop syncing its accounts.`)) return;
                              setDisconnecting(item.item_id);
                              try { await disconnectBank(item.item_id); } finally { setDisconnecting(null); }
                            }}
                            disabled={disconnecting === item.item_id}
                            className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                          >
                            {disconnecting === item.item_id ? 'Disconnecting...' : 'Disconnect'}
                          </button>
                        </div>
                      );
                    })
                  ) : user ? (
                    <p className="text-center py-8 text-sm text-flourish-muted">
                      Click below to connect your first bank or credit card account
                    </p>
                  ) : null}

                  {user && (
                    <PlaidLinkButton className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-flourish-border rounded-xl text-sm font-medium text-flourish-secondary hover:border-flourish-orange hover:text-flourish-orange hover:bg-orange-50/30 transition-colors disabled:opacity-50" />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
