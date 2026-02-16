'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Calendar, MapPin, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] text-white">
        {/* Navbar */}
        <nav className="border-b border-[#27272a] bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <span className="font-bold text-white">P</span>
                 </div>
                 <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                   Panel de Control
                 </span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-sm text-zinc-400 hidden md:block">
                  Hola, <span className="text-white">{user?.email}</span>
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Mis Eventos</h1>
              <p className="text-zinc-400">Gestiona y monitorea todos tus eventos desde un solo lugar.</p>
            </div>
            <Link
              href="/events/new"
              className="flex items-center px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Nuevo Evento
            </Link>
          </div>

          {/* Content */}
          {loading ? (
             <div className="flex justify-center items-center h-64">
               <Spinner />
             </div>
          ) : events.length === 0 ? (
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No hay eventos aún</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Comienza creando tu primer evento para gestionar asistentes y generar diplomas.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium"
              >
                Crear Evento <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-[#18181b] border border-[#27272a] rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.15)] flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="bg-orange-500/10 p-3 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                      <Calendar className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {event.name}
                  </h2>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center text-zinc-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.date).toLocaleDateString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-zinc-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
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
