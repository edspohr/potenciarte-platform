'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Globe, 
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { role, user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Handled mobile closing via link onClick directly

  const navItems = [
    { name: 'Panel', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
    ...(role === 'ADMIN' ? [
      { name: 'Eventos', href: '/events', icon: Calendar, roles: ['ADMIN'] },
      { name: 'Analytics', href: '/analytics', icon: Globe, roles: ['ADMIN'] },
    ] : []),
  ];

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Sidebar Container */}
      <aside className={`
        sticky top-0 left-0 z-50 h-[100dvh] bg-[var(--surface-1)] border-r border-[var(--border)]
        flex flex-col transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        
        {/* Header/Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-8 h-8 shrink-0">
              <Image src="/logo.png" alt="Potenciarte" fill className="object-contain" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight text-white whitespace-nowrap animate-fadeIn">
                Potenciarte
              </span>
            )}
          </Link>
          
          <button 
            onClick={toggleSidebar}
            className="flex p-1.5 rounded-lg text-zinc-500 hover:bg-[var(--surface-2)] hover:text-white transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-orange-500/10 text-orange-500' 
                    : 'text-zinc-400 hover:bg-[var(--surface-2)] hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-white'}`} />
                {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-[var(--border)] shrink-0 space-y-4">
          {!collapsed ? (
            <div className="flex flex-col gap-1 px-2 animate-fadeIn">
              <span className={`self-start px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {role === 'ADMIN' ? 'Admin' : 'Staff'}
              </span>
              <span className="text-xs font-medium text-zinc-400 truncate">{user?.email}</span>
            </div>
          ) : (
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center text-xs font-bold text-zinc-400">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
             </div>
          )}

          <button
            onClick={signOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
