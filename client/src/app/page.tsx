'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { LayoutDashboard, QrCode, LogOut } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white p-4">
        <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center border-b border-[#27272a]">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
                <p className="text-zinc-400 text-sm">You are logged in as</p>
                <p className="text-orange-500 font-medium">{user?.email}</p>
            </div>
            
            <div className="p-6 space-y-4">
                <Link 
                    href="/dashboard"
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20"
                >
                    <LayoutDashboard className="w-6 h-6" />
                    Go to Dashboard
                </Link>

                <Link 
                    href="/events"
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg font-semibold transition-all hover:scale-[1.02] border border-[#3f3f46]"
                >
                    <QrCode className="w-5 h-5" />
                    Scan QR (Staff)
                </Link>
            </div>

            <div className="p-4 bg-[#121214] border-t border-[#27272a] flex justify-center">
                 <button
                  onClick={signOut}
                  className="flex items-center text-zinc-500 hover:text-red-400 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
