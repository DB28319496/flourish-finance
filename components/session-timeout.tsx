'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './toast';

// 30 min idle → warning. 5 min after warning with no action → sign out.
const IDLE_MS = 30 * 60 * 1000;
const WARNING_MS = 5 * 60 * 1000;

export function SessionTimeout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [warning, setWarning] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const signOutTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const clear = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (signOutTimer.current) clearTimeout(signOutTimer.current);
    };

    const triggerSignOut = async () => {
      toast.info('Signed out due to inactivity.');
      await signOut();
    };

    const showWarning = () => {
      setWarning(true);
      signOutTimer.current = setTimeout(triggerSignOut, WARNING_MS);
    };

    const reset = () => {
      setWarning(false);
      clear();
      idleTimer.current = setTimeout(showWarning, IDLE_MS);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clear();
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, signOut, toast]);

  if (!warning || !user) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-flourish-text">Still there?</h3>
        <p className="text-sm text-flourish-secondary">
          You've been inactive for 30 minutes. We'll sign you out in 5 minutes to keep your account secure.
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => signOut()}
            className="flex-1 py-2 text-sm font-medium text-flourish-dark border border-flourish-border rounded-xl hover:bg-flourish-hover transition-colors"
          >
            Sign out
          </button>
          <button
            onClick={() => {
              setWarning(false);
              if (signOutTimer.current) clearTimeout(signOutTimer.current);
            }}
            className="flex-1 py-2 text-sm font-semibold text-white bg-flourish-orange rounded-xl hover:bg-orange-600 transition-colors"
          >
            Keep me signed in
          </button>
        </div>
      </div>
    </div>
  );
}
