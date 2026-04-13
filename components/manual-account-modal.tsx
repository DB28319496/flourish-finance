'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { ManualAccount } from '@/lib/mock-data';

const ACCOUNT_TYPES: { value: ManualAccount['type']; label: string; emoji: string; defaultSubtype: string }[] = [
  { value: 'cash', label: 'Cash', emoji: '💵', defaultSubtype: 'Checking' },
  { value: 'investments', label: 'Investment', emoji: '📈', defaultSubtype: 'Brokerage' },
  { value: 'property', label: 'Real Estate', emoji: '🏠', defaultSubtype: 'Primary Home' },
  { value: 'crypto', label: 'Crypto', emoji: '₿', defaultSubtype: 'Wallet' },
  { value: 'creditCards', label: 'Credit Card', emoji: '💳', defaultSubtype: 'Credit Card' },
  { value: 'loans', label: 'Loan', emoji: '📝', defaultSubtype: 'Personal Loan' },
  { value: 'other', label: 'Other Asset', emoji: '💼', defaultSubtype: 'Asset' },
];

interface Props {
  initial?: ManualAccount | null;
  onSave: (account: Omit<ManualAccount, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function ManualAccountModal({ initial, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [institution, setInstitution] = useState(initial?.institution || '');
  const [type, setType] = useState<ManualAccount['type']>(initial?.type || 'cash');
  const [subtype, setSubtype] = useState(initial?.subtype || 'Checking');
  const [balance, setBalance] = useState(initial?.balance?.toString() || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  // Auto-suggest subtype when type changes
  useEffect(() => {
    if (!initial) {
      const meta = ACCOUNT_TYPES.find((t) => t.value === type);
      if (meta && (!subtype || ACCOUNT_TYPES.some((t) => t.defaultSubtype === subtype))) {
        setSubtype(meta.defaultSubtype);
      }
    }
  }, [type]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      institution: institution.trim() || undefined,
      type,
      subtype: subtype.trim(),
      balance: parseFloat(balance) || 0,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-flourish-border">
          <h2 className="font-display text-xl font-bold text-flourish-dark">
            {initial ? 'Edit Account' : 'Add Manual Account'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-flourish-hover transition-colors">
            <X size={18} className="text-flourish-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type picker */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border transition-colors ${
                    type === t.value
                      ? 'border-flourish-orange bg-flourish-orange/10'
                      : 'border-flourish-border hover:bg-flourish-hover'
                  }`}
                >
                  <div className="text-xl mb-1">{t.emoji}</div>
                  <div className="text-[10px] font-medium text-flourish-dark leading-tight">{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Primary Home, Bitcoin Wallet, Emergency Cash"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
          </div>

          {/* Institution (optional) */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Institution <span className="text-flourish-muted font-normal">(optional)</span></label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Coinbase, Zillow estimate, USAA"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
          </div>

          {/* Subtype */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Subtype / Description</label>
            <input
              type="text"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              placeholder="e.g., Condo, Savings, ETH wallet"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Current Value ($)</label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              placeholder="0.00"
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange"
            />
            {(type === 'creditCards' || type === 'loans') && (
              <p className="text-xs text-flourish-muted mt-1">Enter the outstanding balance (positive number)</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-flourish-dark mb-1.5">Notes <span className="text-flourish-muted font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything you want to remember..."
              rows={2}
              className="w-full px-3 py-2.5 border border-flourish-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-flourish-orange/30 focus:border-flourish-orange resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {onDelete && initial && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Delete "${initial.name}"?`)) {
                    await onDelete();
                    onClose();
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-flourish-dark border border-flourish-border rounded-xl hover:bg-flourish-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-flourish-orange rounded-xl hover:bg-orange-600"
            >
              {initial ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
