'use client';

import { useState, useEffect, use } from 'react';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, CheckCircle, Upload, Send, QrCode,
  Calendar, MapPin, FileText, Award, Download, Eye, UserCheck
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { Event, Attendee } from '@/types';

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<{ total: number; checkedIn: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendees' | 'diplomas'>('attendees');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchAll = async () => {
    try {
      const [eventRes, attendeesRes, statsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/attendees`),
        api.get(`/events/${eventId}/attendees/stats`),
      ]);
      setEvent(eventRes.data);
      setAttendees(attendeesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading:', error);
      toast.error('Error al cargar datos del evento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [eventId]);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/events/${eventId}/attendees/upload`, formData);
      toast.success('Asistentes cargados correctamente');
      fetchAll();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Error al cargar CSV');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/events/${eventId}/diplomas/upload`, formData);
      toast.success('Plantilla subida correctamente');
      fetchAll();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Error al subir plantilla');
    }
  };

  const handleSendDiplomas = async () => {
    if (!confirm('¿Enviar diplomas a todos los asistentes con check-in?')) return;
    setSending(true);
    try {
      const response = await api.post(`/events/${eventId}/diplomas/send-batch`);
      toast.success(`${response.data.sent} diplomas enviados`);
    } catch (error) {
      console.error('Error sending diplomas:', error);
      toast.error('Error al enviar diplomas');
    } finally {
      setSending(false);
    }
  };

  const handleSendInvitations = async () => {
    if (!confirm('¿Enviar invitaciones a todos los asistentes?')) return;
    try {
      await api.post(`/events/${eventId}/invitations`);
      toast.success('Invitaciones enviadas');
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Error al enviar invitaciones');
    }
  };

  if (loading) return <ProtectedRoute><Spinner /></ProtectedRoute>;
  if (!event) return <ProtectedRoute><p className="text-center p-10 text-zinc-500">Evento no encontrado</p></ProtectedRoute>;

  const checkedInPercent = stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white pb-10">
        {/* Header */}
        <div className="border-b border-[var(--border)] glass sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/dashboard" className="inline-flex items-center text-xs text-zinc-500 hover:text-white mb-3 transition-colors gap-1.5 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{event.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mt-1.5 font-medium">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{new Date(event.eventDate).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.location}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/events/${eventId}/check-in`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                >
                  <QrCode className="w-3.5 h-3.5" /> Check-in
                </Link>
                <button
                  onClick={handleSendInvitations}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--surface-3)] text-zinc-300 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-4)] hover:text-white transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Invitaciones
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fadeIn">
            <div className="premium-card p-5 flex items-center gap-4 hover:translate-y-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-600/5"><Users className="w-5 h-5 text-blue-400" /></div>
              <div><p className="text-2xl font-bold">{stats?.total || 0}</p><p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Total</p></div>
            </div>
            <div className="premium-card p-5 flex items-center gap-4 hover:translate-y-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5"><UserCheck className="w-5 h-5 text-emerald-400" /></div>
              <div><p className="text-2xl font-bold">{stats?.checkedIn || 0}</p><p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Check-in</p></div>
            </div>
            <div className="premium-card p-5 flex items-center gap-4 hover:translate-y-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/15 to-orange-600/5">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-black text-orange-400">{checkedInPercent}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Pendientes</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border)] max-w-xs">
            <button
              onClick={() => setActiveTab('attendees')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'attendees' ? 'bg-[var(--surface-3)] text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
              <Users className="w-4 h-4 inline mr-1.5" />Asistentes
            </button>
            <button
              onClick={() => setActiveTab('diplomas')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'diplomas' ? 'bg-[var(--surface-3)] text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
            >
              <Award className="w-4 h-4 inline mr-1.5" />Diplomas
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'attendees' && (
            <div className="animate-fadeIn">
              {/* Upload */}
              <div className="premium-card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:translate-y-0">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-violet-500/15 to-violet-600/5 p-2.5 rounded-xl"><Upload className="w-4 h-4 text-violet-400" /></div>
                  <div>
                    <p className="text-sm font-bold">Cargar Asistentes</p>
                    <p className="text-[11px] text-zinc-500">Subir archivo CSV con columnas: nombre, email, rut</p>
                  </div>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--surface-3)] border border-[var(--border)] text-zinc-300 rounded-xl hover:bg-[var(--surface-4)] hover:text-white transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Cargando...' : 'Seleccionar CSV'}
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {/* Table */}
              {attendees.length === 0 ? (
                <div className="premium-card p-12 text-center hover:translate-y-0">
                  <Users className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No hay asistentes registrados. Sube un archivo CSV para comenzar.</p>
                </div>
              ) : (
                <div className="premium-card overflow-hidden hover:translate-y-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                          <th className="text-left px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nombre</th>
                          <th className="text-left px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                          <th className="text-left px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">RUT</th>
                          <th className="text-center px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.map((a) => (
                          <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                            <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{a.name}</td>
                            <td className="px-5 py-3.5 text-zinc-400 hidden md:table-cell">{a.email}</td>
                            <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs hidden lg:table-cell">{a.rut || '—'}</td>
                            <td className="px-5 py-3.5 text-center">
                              {a.checkedIn ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle className="w-3 h-3" /> Validado
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-500 border border-zinc-700">
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diplomas' && (
            <div className="animate-fadeIn space-y-5">
              {/* Upload template */}
              <div className="premium-card p-5 hover:translate-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-2.5 rounded-xl"><FileText className="w-4 h-4 text-amber-400" /></div>
                    <div>
                      <p className="text-sm font-bold">Plantilla de Diploma</p>
                      <p className="text-[11px] text-zinc-500">
                        {event.diplomaTemplateUrl ? 'Plantilla cargada ✓' : 'Sube un archivo PDF como plantilla'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--surface-3)] border border-[var(--border)] text-zinc-300 rounded-xl hover:bg-[var(--surface-4)] hover:text-white transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      {event.diplomaTemplateUrl ? 'Reemplazar' : 'Subir PDF'}
                      <input type="file" accept=".pdf" onChange={handleTemplateUpload} className="hidden" />
                    </label>
                    {event.diplomaTemplateUrl && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/diplomas/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--surface-3)] border border-[var(--border)] text-zinc-300 rounded-xl hover:bg-[var(--surface-4)] hover:text-white transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Send batch */}
              <div className="premium-card p-5 hover:translate-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-2.5 rounded-xl"><Award className="w-4 h-4 text-emerald-400" /></div>
                    <div>
                      <p className="text-sm font-bold">Enviar Diplomas</p>
                      <p className="text-[11px] text-zinc-500">Se enviarán a todos los asistentes con check-in ({stats?.checkedIn || 0})</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSendDiplomas}
                    disabled={sending || !event.diplomaTemplateUrl}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? 'Enviando...' : 'Enviar Diplomas'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
