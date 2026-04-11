'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { DataProvider } from '@/lib/data-context';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-flourish-cream grain-overlay">
        <AuthProvider>
          <DataProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <main className="flex-1 overflow-y-auto">
                <div className="p-8">
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
