'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { OnboardingTour } from './onboarding';

/**
 * Shows the onboarding tour automatically the first time a newly
 * authenticated user lands on the app (unless they've completed it
 * before). Hidden on the /login route.
 */
export function OnboardingGate() {
  const { user, loading } = useAuth();
  const { userSettings } = useData();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (pathname === '/login') return;

    // Only check once per session unless userSettings changes
    if (!checked) {
      // Wait a bit for userSettings to load from Firestore
      const timeout = setTimeout(() => {
        if (!userSettings.onboardingCompleted) {
          setOpen(true);
        }
        setChecked(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, userSettings.onboardingCompleted, pathname, checked]);

  if (!user || pathname === '/login') return null;

  return <OnboardingTour open={open} onComplete={() => setOpen(false)} />;
}
