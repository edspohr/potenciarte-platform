'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, QrCode } from 'lucide-react';
import api from '../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event } from '@/types';
import Spinner from '@/components/Spinner';

export default function StaffPortal() {
  const [events, setEvents] = useState<Event[]>([]);
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
      <div className="min-h-screen bg-[#09090b] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-6 shadow-lg">
               <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Staff Portal</h1>
            <p className="text-zinc-400">Select an event to start checking in attendees</p>
          </header>

          {loading ? (
             <Spinner />
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 bg-[#18181b] rounded-xl border border-[#27272a]">
              No active events found.
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}/check-in`}
                  className="group block bg-[#18181b] border border-[#27272a] rounded-xl p-6 hover:border-green-500/50 hover:bg-[#18181b]/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                        {event.name}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-zinc-400 gap-2 sm:gap-6">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-zinc-500" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-zinc-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
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
