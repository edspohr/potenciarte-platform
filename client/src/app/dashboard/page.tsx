'use client';

import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Calendar, MapPin, ArrowRight, Settings, Globe, Upload, Trash2, X, LayoutList, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import { toast } from 'sonner';

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
  const { role } = useAuth();

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
    const isDraft = status === 'DRAFT';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
        isDraft ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      }`}>
        {isDraft ? 'Configurando' : 'Activo'}
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
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Panel de Control</h1>
            <p className="text-sm text-zinc-400">Gestiona y monitorea la operación de todos tus eventos.</p>
          </div>
          {role === 'ADMIN' && (
            <Link
              href="/events/new"
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </Link>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-16 text-center animate-scaleIn">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutList className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tu agenda está vacía</h3>
            <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
              Aún no tienes eventos configurados. Comienza creando tu primer evento para emitir invitaciones QR y acreditar asistentes.
            </p>
            {role === 'ADMIN' && (
              <Link href="/events/new" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-bold transition-colors">
                Comenzar <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-[var(--surface-1)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl">
            {/* List Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-[var(--surface-2)] border-b border-[var(--border)] text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <div className="col-span-5">Información del Evento</div>
              <div className="col-span-3">Fecha y Lugar</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-right">Acción</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-[var(--border)]">
              {events.map((event, index) => {
                const status = (event.status || 'DRAFT').toUpperCase();
                const isDraft = status === 'DRAFT';

                return (
                  <div key={event.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center hover:bg-[var(--surface-2)]/50 transition-colors stagger-${Math.min(index + 1, 5)} animate-slideUp`}>
                    
                    {/* Event Info */}
                    <div className="col-span-1 md:col-span-5 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        {isDraft ? <Settings className="w-5 h-5 text-zinc-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-white truncate">{event.name}</h2>
                        <p className="text-xs text-zinc-500 mt-1 truncate">ID: {event.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Date & Location */}
                    <div className="col-span-1 md:col-span-3 space-y-1.5">
                      <div className="flex items-center text-xs text-zinc-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-600 shrink-0" />
                        <span className="truncate">
                          {new Date(event.eventDate).toLocaleDateString('es-CL', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-zinc-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-zinc-600 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-1 md:col-span-2 md:text-center mt-2 md:mt-0">
                      {getStatusBadge(status)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 md:col-span-2 flex justify-end mt-4 md:mt-0">
                      {isDraft && role === 'ADMIN' ? (
                        <button
                          onClick={() => setSelectedDraft(event)}
                          className="w-full md:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors border border-zinc-700"
                        >
                          Configurar
                        </button>
                      ) : (
                        <Link
                          href={role === 'ADMIN' ? `/events/${event.id}` : `/events/${event.id}/check-in`}
                          className="w-full md:w-auto px-4 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white text-xs font-bold rounded-lg transition-colors border border-orange-500/20 text-center"
                        >
                          {role === 'ADMIN' ? 'Administrar' : 'Escanear QR'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Draft Control Modal (preserved design but integrated) */}
        {selectedDraft && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn" 
              onClick={() => !isPublishing && !isDeleting && setSelectedDraft(null)} 
            />
            
            <div className="relative bg-[var(--surface-1)] w-full max-w-lg overflow-hidden animate-scaleIn border border-[var(--border)] rounded-3xl shadow-2xl">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
                <div>
                  <h3 className="text-xl font-bold text-white leading-tight">{selectedDraft.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Estado de Configuración</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedDraft(null)}
                  disabled={isPublishing || isDeleting}
                  className="p-2 hover:bg-[var(--surface-3)] rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {renderStepper(selectedDraft)}

                <div className="grid grid-cols-1 gap-4">
                  <Link
                    href={`/events/${selectedDraft.id}`}
                    className="group bg-[var(--surface-2)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-4 hover:border-orange-500/40 transition-all"
                  >
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">Configurar Detalles</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Asistentes, staff, plantillas y reportes.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                  </Link>

                  <button
                    onClick={async () => {
                      setIsPublishing(true);
                      try {
                        await api.patch(`/events/${selectedDraft.id}`, { status: 'PUBLISHED' });
                        toast.success('¡Evento publicado exitosamente!');
                        setSelectedDraft(null);
                        fetchEvents();
                      } catch {
                        toast.error('Error al publicar el evento');
                      } finally {
                        setIsPublishing(false);
                      }
                    }}
                    disabled={isPublishing || isDeleting || !selectedDraft._progress?.hasAttendees}
                    className="group bg-[var(--surface-2)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                      {isPublishing ? <Spinner /> : <Globe className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">Publicar Evento</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {!selectedDraft._progress?.hasAttendees ? 'Requiere cargar asistentes primero' : 'Activar operaciones y escáner.'}
                      </p>
                    </div>
                    <Upload className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que deseas eliminar este borrador permanentemente?')) {
                        setIsDeleting(true);
                        try {
                          await api.delete(`/events/${selectedDraft.id}`);
                          toast.success('Borrador eliminado correctamente');
                          setSelectedDraft(null);
                          fetchEvents();
                        } catch {
                          toast.error('Error al eliminar');
                        } finally {
                          setIsDeleting(false);
                        }
                      }
                    }}
                    disabled={isPublishing || isDeleting}
                    className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 p-3 rounded-xl flex items-center justify-center gap-2 text-red-500/80 hover:text-red-400 text-xs font-bold transition-colors w-full mt-4"
                  >
                    {isDeleting ? <Spinner /> : <><Trash2 className="w-4 h-4" /> Eliminar Borrador</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
