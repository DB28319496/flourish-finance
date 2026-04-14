import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-flourish-cream z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="text-flourish-orange">
          <svg width="48" height="48" viewBox="0 0 36 36" fill="none" className="animate-pulse">
            <path d="M18 4C18 4 22 8 26 8C30 8 32 12 30 16C28 20 24 20 22 18C20 16 18 12 18 12C18 12 16 16 14 18C12 20 8 20 6 16C4 12 6 8 10 8C14 8 18 4 18 4Z" fill="currentColor" />
            <path d="M18 12C18 12 20 16 22 18C24 20 24 24 22 28C20 32 16 32 14 28C12 24 12 20 14 18C16 16 18 12 18 12Z" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-flourish-secondary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-body text-sm">Loading Flourish…</span>
        </div>
      </div>
    </div>
  );
}
