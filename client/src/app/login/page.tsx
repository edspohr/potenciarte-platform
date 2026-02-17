'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, User } from 'lucide-react';

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
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-[20%] right-[0%] w-[30%] h-[30%] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="text-center mb-8">
            <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 tracking-tight">
            Plataforma Potenciarte
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
            Gestión integral de eventos y asistentes
            </p>
        </div>

        <div className="bg-[#18181b]/80 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl border border-[#27272a] sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-[#27272a] rounded-xl shadow-sm placeholder-zinc-500 bg-[#09090b] text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-[#27272a] rounded-xl shadow-sm placeholder-zinc-500 bg-[#09090b] text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? 'Iniciando sesión...' : 'Ingresar'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27272a]" />
              </div>
              <div className="relative flex justify-start"> {/* Left aligned for label */}
                <span className="pr-2 bg-[#18181b] text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Acceso Rápido (Demo)
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDevLogin('admin')}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-[#27272a] rounded-xl shadow-sm bg-[#09090b] text-sm font-medium text-zinc-300 hover:bg-[#27272a] hover:text-white transition-all group"
              >
                <ShieldCheck className="w-4 h-4 text-orange-500 group-hover:text-orange-400" />
                <span>Admin</span>
              </button>
               <button
                type="button"
                onClick={() => handleDevLogin('staff')}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-[#27272a] rounded-xl shadow-sm bg-[#09090b] text-sm font-medium text-zinc-300 hover:bg-[#27272a] hover:text-white transition-all group"
              >
                <User className="w-4 h-4 text-blue-500 group-hover:text-blue-400" />
                <span>Staff</span>
              </button>
            </div>
             <p className="mt-4 text-center text-xs text-zinc-600">
                Selecciona un perfil para probar la plataforma sin credenciales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
