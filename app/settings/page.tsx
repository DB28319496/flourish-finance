'use client';

import { useState } from 'react';
import { User, Bell, Shield, Palette, CreditCard, Link2, LogOut } from 'lucide-react';
import { Card } from '@/components/ui';
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
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [largeTransactions, setLargeTransactions] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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

            <div className="pt-4 border-t border-flourish-border mt-4">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
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
                      <span className="text-white text-xl font-semibold">JD</span>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-flourish-orange border border-flourish-orange rounded-lg hover:bg-orange-50 transition-colors">
                      Change Photo
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-flourish-dark mb-1.5">First Name</label>
                      <input
                        type="text"
                        defaultValue="John"
                        className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-flourish-dark mb-1.5">Last Name</label>
                      <input
                        type="text"
                        defaultValue="Doe"
                        className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-flourish-dark mb-1.5">Email</label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-flourish-dark mb-1.5">Currency</label>
                    <select className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm text-flourish-dark bg-white focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange">
                      <option>USD ($)</option>
                      <option>EUR (&euro;)</option>
                      <option>GBP (&pound;)</option>
                    </select>
                  </div>

                  <button className="px-6 py-2.5 bg-flourish-orange text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors">
                    Save Changes
                  </button>
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
                    <Toggle enabled={emailNotifs} onChange={() => setEmailNotifs(!emailNotifs)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Push Notifications</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Browser push notifications</p>
                    </div>
                    <Toggle enabled={pushNotifs} onChange={() => setPushNotifs(!pushNotifs)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Weekly Report</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Get a weekly summary of your finances</p>
                    </div>
                    <Toggle enabled={weeklyReport} onChange={() => setWeeklyReport(!weeklyReport)} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-flourish-border">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Budget Alerts</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Alert when nearing budget limits</p>
                    </div>
                    <Toggle enabled={budgetAlerts} onChange={() => setBudgetAlerts(!budgetAlerts)} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-flourish-dark">Large Transaction Alerts</p>
                      <p className="text-xs text-flourish-secondary mt-0.5">Notify on transactions over $500</p>
                    </div>
                    <Toggle enabled={largeTransactions} onChange={() => setLargeTransactions(!largeTransactions)} />
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
                    <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
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
                <h2 className="font-display text-xl font-bold text-flourish-text mb-6">Connected Accounts</h2>
                <div className="space-y-4">
                  {['Chase Bank', 'Bank of America', 'Fidelity Investments'].map((bank) => (
                    <div key={bank} className="flex items-center justify-between py-3 border-b border-flourish-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-flourish-hover flex items-center justify-center">
                          <span className="text-sm font-bold text-flourish-dark">{bank.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-flourish-dark">{bank}</p>
                          <p className="text-xs text-emerald-500">Connected</p>
                        </div>
                      </div>
                      <button className="text-xs font-medium text-red-500 hover:underline">Disconnect</button>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-flourish-border rounded-xl text-sm font-medium text-flourish-secondary hover:border-flourish-orange hover:text-flourish-orange transition-colors">
                    + Connect New Account
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
