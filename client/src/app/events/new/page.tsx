'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, MapPin, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

export default function NewEvent() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    eventDate: '',
    headerImage: '',
    signatureImage: '',
  });

  useEffect(() => {
    if (!authLoading && role && role !== 'ADMIN') {
      toast.error('No tienes permisos para crear eventos');
      router.push('/dashboard');
    }
  }, [role, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Remove empty strings for optional fields
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '')
      );

      const payload = {
        ...cleanData,
        eventDate: new Date(formData.eventDate).toISOString(),
      };
      
      const response = await api.post('/events', payload);
      router.push(`/events/${response.data.id}`);
      toast.success('Evento creado exitosamente');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error al crear el evento');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <Spinner />;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] py-10 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-lg mx-auto animate-fadeIn">
          {/* Back link */}
          <Link href="/dashboard" className="inline-flex items-center text-xs text-zinc-500 hover:text-white mb-6 transition-colors gap-1.5 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Dashboard
          </Link>

          {/* Card */}
          <div className="glass rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-7">
              <div className="bg-gradient-to-br from-orange-500/15 to-orange-600/5 p-2.5 rounded-xl">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">Crear Nuevo Evento</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Completa los datos del evento</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <Calendar className="w-3 h-3 inline mr-1.5" />
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-white text-sm p-3 transition-all placeholder:text-zinc-600"
                  placeholder="Ej: Conferencia Tech 2025"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <Calendar className="w-3 h-3 inline mr-1.5" />
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  required
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="block w-full rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-white text-sm p-3 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <MapPin className="w-3 h-3 inline mr-1.5" />
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-white text-sm p-3 transition-all placeholder:text-zinc-600"
                  placeholder="Ej: Salón de Eventos Santiago"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <FileText className="w-3 h-3 inline mr-1.5" />
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-white text-sm p-3 transition-all placeholder:text-zinc-600 resize-none"
                  placeholder="Breve descripción del evento..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <ImageIcon className="w-3 h-3 inline mr-1.5" />
                  URL Imagen de Cabecera
                </label>
                <input
                  type="text"
                  name="headerImage"
                  value={formData.headerImage}
                  onChange={handleChange}
                  className="block w-full rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-white text-sm p-3 transition-all placeholder:text-zinc-600"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-[var(--shadow-glow-primary)]"
                >
                  {loading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-white animate-spin" />
                  ) : (
                    'Crear Evento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
