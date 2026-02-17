'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="animate-float mb-6">
          <Image src="/logo.png" alt="Potenciarte" width={48} height={48} className="opacity-80" />
        </div>
        <div className="relative mb-4">
          <div className="h-8 w-8 rounded-full border-2 border-transparent border-t-orange-500 border-r-orange-500/30 animate-spin" />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
