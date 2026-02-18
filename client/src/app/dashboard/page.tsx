'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Calendar, MapPin, LogOut, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

interface Event {
  id: string;
  name: string;
  date: string;
  eventDate: string;
  location: string;
  status: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user, role } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
      } finally {
        setLoading(false);
      }
    };

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white">
        {/* Navbar */}
        <nav className="border-b border-[var(--border)] glass sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Potenciarte" width={32} height={32} />
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-semibold text-zinc-300">
                    Panel de Control
                  </span>
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
              {events.map((event, index) => (
                <Link
                  key={event.id}
                  href={role === 'ADMIN' ? `/events/${event.id}` : `/events/${event.id}/check-in`}
                  className={`group premium-card p-6 flex flex-col stagger-${Math.min(index + 1, 5)} animate-slideUp`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-3 rounded-xl group-hover:from-orange-500/20 group-hover:to-orange-600/10 transition-all duration-500">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                  
                  <h2 className="text-lg font-bold text-white mb-3 line-clamp-1 group-hover:text-orange-400 transition-colors duration-300">
                    {event.name}
                  </h2>
                  
                  <div className="space-y-2.5 mt-auto">
                    <div className="flex items-center text-zinc-500 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-2 text-zinc-600" />
                      {new Date(event.eventDate || event.date).toLocaleDateString('es-CL', {
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

                  {/* Bottom gradient line */}
                  <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                      {role === 'ADMIN' ? 'Administrar' : 'Operación'}
                    </span>
                    <span className="text-xs text-zinc-400 group-hover:text-orange-500 transition-colors flex items-center gap-1.5 font-semibold">
                      {role === 'ADMIN' ? 'Ver detalles' : 'Ir a Check-in'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
