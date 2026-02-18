'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  linkWithCredential,
  GoogleAuthProvider,
  AuthCredential,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

type Tab = 'login' | 'register';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Account Linking State
  const [linkingCredential, setLinkingCredential] = useState<AuthCredential | null>(null);
  const [linkingEmail, setLinkingEmail] = useState<string | null>(null);

  // Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Ingresa tu correo');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success('Correo de recuperación enviado');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (linkingCredential && linkingEmail) {
      // Handle Account Linking
      try {
        const userCredential = await signInWithEmailAndPassword(auth, linkingEmail, password);
        await linkWithCredential(userCredential.user, linkingCredential);
        toast.success('Cuenta vinculada exitosamente');
        router.push('/dashboard');
      } catch (err: any) {
        console.error('Link Error:', err);
        if (err.code === 'auth/wrong-password') {
          toast.error('Contraseña incorrecta');
        } else {
          toast.error('Error al vincular cuenta');
        }
      } finally {
         setLoading(false);
      }
      return;
    }

    try {
      if (tab === 'login') {
        await signIn(email, password);
        toast.success('¡Bienvenido de vuelta!');
      } else {
        if (!name.trim()) {
          toast.error('Ingresa tu nombre completo');
          return;
        }
        await signUp(email, password, name);
        toast.success('¡Cuenta creada! Bienvenido a Potenciarte.');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Correo o contraseña incorrectos.');
      } else if (code === 'auth/email-already-in-use') {
        toast.error('Este correo ya está registrado. Inicia sesión.');
      } else if (code === 'auth/weak-password') {
        toast.error('La contraseña debe tener al menos 6 caracteres.');
      } else {
        toast.error('Ocurrió un error. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('¡Bienvenido!');
    } catch (err: any) {
       console.error('Google Sign In Error:', err);
       if (err.code === 'auth/account-exists-with-different-credential') {
          const credential = GoogleAuthProvider.credentialFromError(err);
          const email = err.customData?.email;
          if (credential && email) {
             setLinkingCredential(credential);
             setLinkingEmail(email);
             setEmail(email); // Pre-fill email
             setTab('login'); // Force login tab
             toast.info(`Ya existe una cuenta con ${email}. Ingresa tu contraseña para vincularla.`);
          }
       } else {
         toast.error('Error al iniciar sesión con Google.');
       }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex text-white relative overflow-hidden">
      {/* ... (keep branding section) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-orange-500/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-orange-400/5 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 noise pointer-events-none" />

        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="mb-10 relative">
            <div className="absolute -inset-6 bg-orange-500/15 rounded-full blur-2xl animate-pulseGlow" />
            <Image src="/logo.png" alt="Potenciarte" width={88} height={88} className="relative animate-float drop-shadow-2xl" />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">Potenciarte</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            Gestión integral de eventos, acreditación por QR y diplomas digitales.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { emoji: '🎟️', title: 'Tickets QR', desc: 'Generación y escaneo instantáneo' },
              { emoji: '🎓', title: 'Diplomas digitales', desc: 'Envío automático por correo' },
              { emoji: '✅', title: 'Check-in seguro', desc: 'Control de acceso en tiempo real' },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left"
              >
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile background blobs */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 noise pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px] animate-fadeIn">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Image src="/logo.png" alt="Potenciarte" width={52} height={52} className="mb-3 animate-float" />
            <h2 className="text-2xl font-extrabold gradient-text">Potenciarte</h2>
          </div>

          {/* Card */}
          <div className="glass rounded-3xl p-8 shadow-2xl border border-white/[0.08]">
             {/* Linking Message */}
             {linkingEmail && (
                 <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center animate-slideDown">
                    <p className="text-sm text-orange-200">
                       La cuenta <strong className="text-white">{linkingEmail}</strong> ya existe.
                       <br/>
                       Ingresa tu contraseña para vincularla con Google.
                    </p>
                 </div>
             )}

            {/* Tabs */}
            {!linkingEmail && (
                <div className="flex bg-white/[0.04] rounded-2xl p-1 mb-7 gap-1">
                  {(['login', 'register'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        tab === t
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                    </button>
                  ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (register only) */}
              {tab === 'register' && !linkingEmail && (
                <div className="animate-slideDown">
                  <label htmlFor="name" className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required={tab === 'register'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="block w-full pl-11 pr-4 py-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-white placeholder-zinc-600 text-sm transition-all"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    disabled={!!linkingEmail}
                    className="block w-full pl-11 pr-4 py-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-white placeholder-zinc-600 text-sm transition-all disabled:opacity-50"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-11 py-3.5 border border-[var(--border)] rounded-xl bg-[var(--surface-1)] text-white placeholder-zinc-600 text-sm transition-all"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {tab === 'register' && !linkingEmail && (
                  <p className="mt-1.5 text-[11px] text-zinc-600">Mínimo 6 caracteres</p>
                )}
                {tab === 'login' && !linkingEmail && (
                  <div className="mt-2 text-right">
                     <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors"
                     >
                        ¿Olvidaste tu contraseña?
                     </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[var(--shadow-glow-primary)] mt-2"
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
                ) : (
                  <>
                    {linkingEmail ? 'Vincular y Entrar' : (tab === 'login' ? 'Ingresar' : 'Crear cuenta')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
               {linkingEmail && (
                   <button
                       type="button"
                       onClick={() => {
                           setLinkingEmail(null);
                           setLinkingCredential(null);
                           setEmail('');
                           setPassword('');
                       }}
                       className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline"
                   >
                       Cancelar vinculación
                   </button>
               )}
            </form>

            {/* Divider */}
            {!linkingEmail && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[var(--glass-bg)] text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
                  o continúa con
                </span>
              </div>
            </div>
            )}

            {/* Google */}
            {!linkingEmail && (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-[var(--border)] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  Continuar con Google
                </>
              )}
            </button>
            )}

            {/* Staff note */}
            {tab === 'register' && !linkingEmail && (
              <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Las cuentas nuevas se crean con perfil <span className="text-blue-400 font-semibold">Staff</span>. Un administrador puede elevar tu acceso desde el panel de Firebase.
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-700">
            © {new Date().getFullYear()} Potenciarte · Sporh Solutions
          </p>
        </div>
      </div>
      
      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-white mb-2">Restablecer contraseña</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
            </p>
            
            <form onSubmit={handleResetPassword}>
              <div className="relative mb-4">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="block w-full pl-11 pr-4 py-3 border border-[var(--border)] rounded-xl bg-black/20 text-white placeholder-zinc-600 text-sm focus:border-orange-500 transition-all outline-none"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                   {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
