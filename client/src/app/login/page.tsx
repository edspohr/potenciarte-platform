'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, User, ArrowRight, Lock, Mail } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
      toast.success('Bienvenido a Potenciarte');
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (role: 'admin' | 'staff') => {
    setLoading(true);
    try {
      if (role === 'admin') {
        await signIn('admin@potenciarte.cl', '123456');
        toast.success('Modo Demo: Acceso Admin');
      } else {
        await signIn('staff@potenciarte.cl', '123456');
        toast.success('Modo Demo: Acceso Staff');
      }
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Error en Modo Demo. ¿Están creados los usuarios?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-orange-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-5%] w-[35%] h-[35%] bg-amber-600/5 rounded-full blur-[100px]" />
      </div>
      <div className="absolute inset-0 noise pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] z-10 relative animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Image src="/logo.png" alt="Potenciarte" width={52} height={52} className="animate-float" />
          </div>
          <h2 className="text-3xl font-extrabold gradient-text tracking-tight">
            Potenciarte
          </h2>
          <p className="mt-2 text-sm text-zinc-500 font-medium">
            Gestión integral de eventos y asistentes
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-white placeholder-zinc-600 text-sm transition-all"
                  placeholder="nombre@empresa.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-white placeholder-zinc-600 text-sm transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[var(--shadow-glow-primary)]"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[var(--glass-bg)] text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
                Acceso Rápido
              </span>
            </div>
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDevLogin('admin')}
              disabled={loading}
              className="group flex items-center justify-center gap-2 py-2.5 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-sm font-medium text-zinc-400 hover:bg-[var(--surface-3)] hover:text-white hover:border-orange-500/20 transition-all duration-300"
            >
              <ShieldCheck className="w-4 h-4 text-orange-500 group-hover:text-orange-400" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin('staff')}
              disabled={loading}
              className="group flex items-center justify-center gap-2 py-2.5 px-4 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-sm font-medium text-zinc-400 hover:bg-[var(--surface-3)] hover:text-white hover:border-blue-500/20 transition-all duration-300"
            >
              <User className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
              Staff
            </button>
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-600">
            Selecciona un perfil para probar la plataforma
          </p>
        </div>
      </div>
    </div>
  );
}
