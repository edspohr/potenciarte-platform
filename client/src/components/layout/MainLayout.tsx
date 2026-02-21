'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-[100dvh] bg-[var(--background)] text-white overflow-hidden">
        <Sidebar />
        <main className="flex-1 w-full overflow-y-auto no-scrollbar relative min-h-[100dvh]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
