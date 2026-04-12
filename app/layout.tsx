'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-context';
import { Menu } from 'lucide-react';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile drawer on route change (clicking a link)
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  return (
    <html lang="en">
      <body className="bg-flourish-cream grain-overlay">
        <AuthProvider>
          <DataProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Mobile overlay */}
              {isMobile && mobileOpen && (
                <div
                  className="fixed inset-0 z-[80] bg-black/40"
                  onClick={() => setMobileOpen(false)}
                />
              )}

              {/* Sidebar */}
              <div
                className={`${
                  isMobile
                    ? `fixed left-0 top-0 z-[85] transform transition-transform duration-300 ${
                        mobileOpen ? 'translate-x-0' : '-translate-x-full'
                      }`
                    : ''
                }`}
              >
                <Sidebar
                  collapsed={!isMobile && sidebarCollapsed}
                  onToggle={() =>
                    isMobile
                      ? setMobileOpen(false)
                      : setSidebarCollapsed(!sidebarCollapsed)
                  }
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>

              {/* Main Content Area */}
              <main className="flex-1 overflow-y-auto">
                {/* Mobile hamburger */}
                {isMobile && (
                  <div className="sticky top-0 z-[70] flex items-center justify-between px-4 py-3 bg-flourish-cream/95 backdrop-blur border-b border-flourish-border">
                    <button
                      onClick={() => setMobileOpen(true)}
                      className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                    >
                      <Menu size={20} className="text-flourish-dark" />
                    </button>
                    <div className="text-flourish-orange">
                      <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                        <path d="M18 4C18 4 22 8 26 8C30 8 32 12 30 16C28 20 24 20 22 18C20 16 18 12 18 12C18 12 16 16 14 18C12 20 8 20 6 16C4 12 6 8 10 8C14 8 18 4 18 4Z" fill="currentColor" />
                        <path d="M18 12C18 12 20 16 22 18C24 20 24 24 22 28C20 32 16 32 14 28C12 24 12 20 14 18C16 16 18 12 18 12Z" fill="currentColor" opacity="0.7" />
                      </svg>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                  </div>
                )}

                <div className="px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
                  {children}
                </div>
              </main>
            </div>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
