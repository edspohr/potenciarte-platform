'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, QrCode, Scan } from 'lucide-react';
import api from '../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event } from '@/types';
import Spinner from '@/components/Spinner';

interface ExtendedEvent extends Omit<Event, '_count'> {
  _count?: {
    attendees: number;
  };
}

export default function StaffPortal() {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white p-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12 text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-600/10 mb-6 border border-blue-500/10">
              <Scan className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Portal de Staff</h1>
            <p className="text-sm text-zinc-500">Selecciona un evento para comenzar el check-in</p>
          </header>

          {loading ? (
            <Spinner />
          ) : events.length === 0 ? (
            <div className="premium-card p-12 text-center animate-scaleIn">
              <QrCode className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">No hay eventos activos.</p>
            </div>
          ) : (
            <div className="grid gap-4 animate-fadeIn">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}/check-in`}
                  className="group premium-card p-5 block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-3 rounded-xl group-hover:from-blue-500/20 transition-all duration-500">
                        <QrCode className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors duration-300">
                          {event.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-zinc-500 gap-1 sm:gap-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            {new Date(event.eventDate).toLocaleDateString('es-CL')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-600" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
