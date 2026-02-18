'use client';

import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BarChart3, Users, CheckCircle2, TrendingUp, Search } from 'lucide-react';
import Spinner from '@/components/Spinner';

interface StaffPerformance {
  email: string;
  count: number;
}

interface EventStats {
  id: string;
  name: string;
  total: number;
  checkedIn: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventStats[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const fetchStaffPerformance = useCallback(async (eventId: string) => {
    try {
      const res = await api.get(`/analytics/events/${eventId}/staff`);
      setStaffPerformance(res.data);
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const eventsRes = await api.get('/events');
      const eventsData = eventsRes.data;
      
      const statsPromises = eventsData.map(async (e: any) => {
        try {
          const statsRes = await api.get(`/events/${e.id}/attendees/stats`);
          return {
            id: e.id,
            name: e.name,
            ...statsRes.data
          };
        } catch {
          return { id: e.id, name: e.name, total: 0, checkedIn: 0, percentage: 0 };
        }
      });

      const allStats = await Promise.all(statsPromises);
      setEvents(allStats);
      
      if (allStats.length > 0) {
        setSelectedEventId(allStats[0].id);
        fetchStaffPerformance(allStats[0].id);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchStaffPerformance]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedEventId) {
      fetchStaffPerformance(selectedEventId);
    }
  }, [selectedEventId, fetchStaffPerformance]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white">
        {/* Navbar */}
        <nav className="border-b border-[var(--border)] glass sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Image src="/logo.png" alt="Potenciarte" width={32} height={32} />
                </Link>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-zinc-300">Analytics</span>
                </div>
              </div>
              <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-10">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              Métricas de Rendimiento
            </h1>
            <p className="text-sm text-zinc-500 mt-2">Visualiza el progreso de tus eventos y el desempeño del staff.</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Progress List */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Resumen de Eventos
                </h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {events.map((event) => (
                    <div 
                      key={event.id}
                      onClick={() => setSelectedEventId(event.id)}
                      className={`premium-card p-6 cursor-pointer transition-all border-l-4 ${
                        selectedEventId === event.id ? 'border-orange-500 bg-orange-500/5' : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-white">{event.name}</h3>
                          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">
                            {event.checkedIn} / {event.total} Asistentes
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">{event.percentage}%</span>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">Check-in</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000"
                          style={{ width: `${event.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Performance Sidebar */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Desempeño Staff
                </h2>

                <div className="premium-card p-6 min-h-[400px]">
                  <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-black flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Check-ins por Usuario
                  </p>

                  {staffPerformance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="p-4 bg-zinc-800/50 rounded-2xl mb-4">
                        <Users className="w-8 h-8 text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-500 italic">No hay datos de staff<br/>para este evento.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {staffPerformance.map((staff, idx) => (
                        <div key={staff.email} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0 ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white truncate max-w-[150px]">{staff.email.split('@')[0]}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{staff.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-orange-500">{staff.count}</p>
                            <p className="text-[9px] text-zinc-600 font-bold uppercase">Escaneos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-indigo-100">Dato Curioso</h3>
                  </div>
                  <p className="text-xs text-indigo-200/60 leading-relaxed italic">
                    El staff más activo suele realizar más de 50 check-ins por hora en eventos de alta concurrencia.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
