'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Calendar, MapPin, LogOut, ArrowRight, LayoutDashboard, Settings, Globe, Upload, Trash2, X, AlertOctagon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  date: string;
  eventDate: string;
  location: string;
  status: string;
  _progress?: {
    hasAttendees: boolean;
    hasTemplate: boolean;
    hasSentTickets: boolean;
    isPublished: boolean;
  };
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { signOut, user, role } = useAuth();
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      toast.error('Error al cargar la lista de eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      PUBLISHED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      PUBLISHED: 'Publicado',
      COMPLETED: 'Completado',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.DRAFT}`}>
        {labels[status] || status}
      </span>
    );
  };

  const renderStepper = (event: Event) => {
    const steps = [
      { id: 1, label: 'Evento Creado', done: true },
      { id: 2, label: 'Asistentes', done: event._progress?.hasAttendees },
      { id: 3, label: 'Plantilla', done: event._progress?.hasTemplate },
      { id: 4, label: 'Invitaciones', done: event._progress?.hasSentTickets },
      { id: 5, label: 'Publicado', done: event._progress?.isPublished },
    ];

    return (
      <div className="mb-8 px-2">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-500 ${
                step.done 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
              }`}>
                {step.done ? '✓' : step.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-2 transition-all duration-700 ${
                  steps[i+1].done ? 'bg-orange-500' : 'bg-zinc-800'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <span className="text-[9px] font-black uppercase tracking-tighter text-orange-500">{steps.find(s => !s.done)?.label || 'Listo'}</span>
          <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-600">Paso {steps.filter(s => s.done).length} de 5</span>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white">
        {/* Navbar */}
        <nav className="border-b border-[var(--border)] glass sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Potenciarte" width={32} height={32} />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-300">Panel</span>
                  </div>
                  {role === 'ADMIN' && (
                    <Link href="/analytics" className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-semibold">Analytics</span>
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-5">
                {role && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    role === 'ADMIN' 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {role === 'ADMIN' ? 'Admin' : 'Staff'}
                  </span>
                )}
                <span className="text-xs text-zinc-500 hidden md:block">
                  {user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors duration-300 gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Mis Eventos</h1>
              <p className="text-sm text-zinc-500">Gestiona y monitorea todos tus eventos.</p>
            </div>
            {role === 'ADMIN' && (
              <Link
                href="/events/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[var(--shadow-glow-primary)]"
              >
                <Plus className="w-4 h-4" />
                Crear Evento
              </Link>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <Spinner />
          ) : events.length === 0 ? (
            <div className="premium-card p-16 text-center animate-scaleIn">
              <div className="w-16 h-16 bg-[var(--surface-3)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-7 h-7 text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No hay eventos aún</h3>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">
                Comienza creando tu primer evento para gestionar asistentes y generar diplomas.
              </p>
              {role === 'ADMIN' && (
                <Link
                  href="/events/new"
                  className="inline-flex items-center text-orange-500 hover:text-orange-400 font-semibold text-sm gap-1.5 transition-colors"
                >
                  Crear Evento <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
              {events.map((event, index) => {
                const status = (event.status || 'DRAFT').toUpperCase();
                const isDraft = status === 'DRAFT';
                
                const cardContent = (
                  <>
                    <div className="flex items-start justify-between mb-5">
                      <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-3 rounded-xl group-hover:from-orange-500/20 group-hover:to-orange-600/10 transition-all duration-500">
                        <Calendar className="w-5 h-5 text-orange-500" />
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    
                    <h2 className="text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-orange-400 transition-colors duration-300">
                      {event.name}
                    </h2>
                    
                    <div className="space-y-2.5 mt-auto">
                      <div className="flex items-center text-zinc-500 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-600" />
                        {new Date(event.eventDate).toLocaleDateString('es-CL', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center text-zinc-500 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-zinc-600" />
                        {event.location}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                        {isDraft ? 'Configuración' : (role === 'ADMIN' ? 'Administrar' : 'Operación')}
                      </span>
                      <div className="flex items-center gap-2">
                        {isDraft && role === 'ADMIN' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedDraft(event);
                            }}
                            className="px-3 py-1 bg-zinc-800 text-white text-[10px] font-bold rounded-lg hover:bg-zinc-700 transition-colors"
                          >
                            Gestionar
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400 group-hover:text-orange-500 transition-colors flex items-center gap-1.5 font-semibold">
                            {role === 'ADMIN' ? 'Ver detalles' : 'Ir a Check-in'} <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                );

                if (isDraft && role === 'ADMIN') {
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedDraft(event)}
                      className={`group premium-card p-6 flex flex-col cursor-pointer stagger-${Math.min(index + 1, 5)} animate-slideUp`}
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={event.id}
                    href={role === 'ADMIN' ? `/events/${event.id}` : `/events/${event.id}/check-in`}
                    className={`group premium-card p-6 flex flex-col stagger-${Math.min(index + 1, 5)} animate-slideUp`}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        {/* Draft Control Modal */}
        {selectedDraft && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn" 
              onClick={() => !isPublishing && !isDeleting && setSelectedDraft(null)} 
            />
            
            <div className="relative premium-card w-full max-w-lg overflow-hidden animate-scaleIn border-zinc-800 shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{selectedDraft.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Estado del Lanzamiento</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedDraft(null)}
                  disabled={isPublishing || isDeleting}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Stepper Implementation */}
                {renderStepper(selectedDraft)}

                {/* Modal Options Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Option A: Resume */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDraft(null);
                      router.push(`/events/${selectedDraft.id}`);
                    }}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all text-left"
                  >
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-indigo-100 italic">Configurar Detalles</p>
                      <p className="text-xs text-indigo-300/60 mt-0.5">Sube asistentes o configura la plantilla.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-500/40 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option B: Publish */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsPublishing(true);
                      try {
                        await api.patch(`/events/${selectedDraft.id}`, { status: 'PUBLISHED' });
                        toast.success('¡Evento publicado exitosamente!');
                        setSelectedDraft(null);
                        fetchEvents();
                      } catch (error) {
                        toast.error('Error al publicar el evento');
                      } finally {
                        setIsPublishing(false);
                      }
                    }}
                    disabled={isPublishing || isDeleting || !selectedDraft._progress?.hasAttendees}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all text-left disabled:opacity-50"
                  >
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                      {isPublishing ? <Spinner /> : <Globe className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-100 italic">Publicar Evento</p>
                      <p className="text-xs text-emerald-300/60 mt-0.5">
                        {!selectedDraft._progress?.hasAttendees 
                          ? 'Debes cargar asistentes primero' 
                          : 'Habilitar para registro y operaciones.'}
                      </p>
                    </div>
                    <Upload className="w-5 h-5 text-emerald-500/40 group-hover:-translate-y-1 transition-transform" />
                  </button>

                  {/* Option C: Delete */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que deseas eliminar este borrador?')) {
                        setIsDeleting(true);
                        try {
                          await api.delete(`/events/${selectedDraft.id}`);
                          toast.success('Borrador eliminado correctamente');
                          setSelectedDraft(null);
                          fetchEvents();
                        } catch (error) {
                          toast.error('Error al eliminar el borrador');
                        } finally {
                          setIsDeleting(false);
                        }
                      }
                    }}
                    disabled={isPublishing || isDeleting}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-left disabled:opacity-50"
                  >
                    <div className="p-3 bg-red-500/20 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
                      {isDeleting ? <Spinner /> : <Trash2 className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-100 italic">Eliminar Borrador</p>
                      <p className="text-xs text-red-300/60 mt-0.5">Borra permanentemente este evento.</p>
                    </div>
                    <AlertOctagon className="w-5 h-5 text-red-500/40 group-hover:animate-pulse" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
