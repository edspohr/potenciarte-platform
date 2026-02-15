'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

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
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-md mx-auto bg-[#121214] p-8 border border-[#27272a] rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-orange-500">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Event Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Date & Time</label>
              <input
                type="datetime-local"
                name="eventDate"
                required
                value={formData.eventDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Location</label>
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Header Image URL</label>
              <input
                type="url"
                name="headerImage"
                value={formData.headerImage}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-[#09090b] border-[#27272a] text-white shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border transition-colors outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-3 px-4 py-2 text-sm font-medium text-zinc-400 bg-transparent border border-[#27272a] rounded-md hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center px-4 py-2 text-sm font-bold text-white bg-orange-600 border border-transparent rounded-md shadow-lg shadow-orange-950/30 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
