'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { toast } from 'sonner';

export default function NewEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    eventDate: '',
    headerImage: '',
    signatureImage: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure ISO date string
      const payload = {
        ...formData,
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-md mx-auto bg-[#18181b] p-8 border border-[#27272a] rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Crear Nuevo Evento</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Nombre del Evento</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-colors outline-none"
                placeholder="Ej: Conferencia Tech 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Fecha y Hora</label>
              <input
                type="datetime-local"
                name="eventDate"
                required
                value={formData.eventDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Ubicación</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-colors outline-none"
                placeholder="Ej: Salón de Eventos Santiago"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Descripción</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-colors outline-none"
                placeholder="Breve descripción del evento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">URL Imagen de Cabecera</label>
              <input
                type="text"
                name="headerImage"
                value={formData.headerImage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border transition-colors outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
