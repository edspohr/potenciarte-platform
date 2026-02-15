'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, MapPin, Calendar, Users } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] text-zinc-100">
        <header className="bg-[#121214] border-b border-[#27272a] sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-white">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Dashboard</h1>
            <Link
              href="/events/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-lg text-white bg-orange-600 hover:bg-orange-700 transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-10">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No events found. Create your first event!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-[#121214] border border-[#27272a] overflow-hidden rounded-xl hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-950/20 transition-all duration-300 group"
                >
                  {event.headerImage && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={event.headerImage}
                        alt={event.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {event.name}
                    </h3>
                    <div className="flex items-center text-sm text-zinc-400 mb-2">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-zinc-400 mb-4">
                      <MapPin className="mr-2 h-4 w-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-zinc-400">
                      <Users className="mr-2 h-4 w-4" />
                      {event._count?.attendees || 0} Attendees
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          event.status === 'PUBLISHED'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {event.status}
                      </span>
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
