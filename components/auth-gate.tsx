'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

// Routes that don't require auth
const PUBLIC_ROUTES = ['/login'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, isPublic, router]);

  // While checking auth, show a centered spinner
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-flourish-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-flourish-orange" />
          <p className="text-sm text-flourish-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes always render (login page)
  if (isPublic) return <>{children}</>;

  // Not authenticated and not on public route — redirect in progress, show spinner
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-flourish-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-flourish-orange" />
          <p className="text-sm text-flourish-secondary">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Authenticated — render app
  return <>{children}</>;
}
