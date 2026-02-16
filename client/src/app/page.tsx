'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { LayoutDashboard, QrCode, LogOut } from 'lucide-react';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/20 rounded-full blur-[120px]" />

        <div className="w-full max-w-4xl z-10">
          <div className="mb-12 text-center">
             <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-4 tracking-tight">
               Potenciarte Platform
             </h1>
             <p className="text-xl text-zinc-400">
               Welcome back, <span className="text-orange-500 font-semibold">{user?.email}</span>
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link 
              href="/dashboard"
              className="group relative p-1 rounded-2xl bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-orange-500 hover:to-orange-600 transition-all duration-300 shadow-2xl hover:shadow-orange-500/20"
            >
              <div className="h-full bg-[#18181b] rounded-xl p-8 flex flex-col items-center text-center group-hover:bg-[#18181b]/90 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Manage Events</h3>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Create, edit, and oversee all your events from one central dashboard.
                </p>
              </div>
            </Link>

            <Link 
              href="/events"
              className="group relative p-1 rounded-2xl bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-green-500 hover:to-green-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/20"
            >
              <div className="h-full bg-[#18181b] rounded-xl p-8 flex flex-col items-center text-center group-hover:bg-[#18181b]/90 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Staff Portal</h3>
                <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Quick access for staff to scan QR codes and check in attendees.
                </p>
              </div>
            </Link>
          </div>

          <div className="flex justify-center">
            <button
              onClick={signOut}
              className="group flex items-center px-6 py-3 rounded-full bg-[#18181b] border border-[#27272a] hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
