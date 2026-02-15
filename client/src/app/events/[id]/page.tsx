'use client';



import { useState, useEffect, use, useCallback } from 'react';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event, Attendee } from '@/types';
import { Upload, Mail, Check, X, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';

export default function EventDetails({ params }: { params: Promise<{ id: string }> }) {
  // Access params using React.use() to unwrap the Promise
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  }, [id]);

  const fetchAttendees = useCallback(async () => {
    try {
      const response = await api.get(`/events/${id}/attendees`);
      setAttendees(response.data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
    fetchAttendees();
  }, [fetchEventDetails, fetchAttendees]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post(`/events/${id}/attendees/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Attendees uploaded successfully!');
      fetchAttendees();
      fetchEventDetails(); // Refresh counts
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload CSV');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const sendInvitations = async () => {
    if (!confirm('Are you sure you want to send invitations to all unsent attendees?')) return;
    
    setSending(true);
    try {
      const response = await api.post(`/events/${id}/invitations`);
      alert(response.data.message);
      fetchAttendees(); // Refresh ticketSent status
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!event) return <div className="p-8 text-center">Event not found</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/dashboard" className="flex items-center text-orange-500 hover:text-orange-400 font-medium transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-[#121214] border border-[#27272a] overflow-hidden rounded-xl mb-8 shadow-2xl">
            <div className="px-4 py-6 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{event.name}</h3>
                <p className="mt-1 max-w-2xl text-sm text-zinc-400">
                  {new Date(event.eventDate).toLocaleDateString()} • {event.location}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center px-4 py-2 border border-[#27272a] text-sm font-medium rounded-md text-zinc-300 bg-[#09090b] hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Upload className="mr-2 h-4 w-4 text-orange-500" />
                  {uploading ? 'Uploading...' : 'Import CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <Link
                  href={`/events/${id}/check-in`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 transition-all active:scale-95"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Check-in Mode
                </Link>
                <button
                  onClick={sendInvitations}
                  disabled={sending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-lg shadow-orange-950/20 text-white bg-orange-600 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272a] overflow-hidden rounded-xl shadow-2xl">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-[#27272a]">
              <h3 className="text-lg font-bold text-white">Attendees ({attendees.length})</h3>
                <div className="text-sm text-zinc-400">
                    Checked In: <span className="font-bold text-orange-500">{attendees.filter(a => a.checkedIn).length}</span> / {attendees.length}
                </div>
            </div>
            <ul className="divide-y divide-[#27272a]">
              {attendees.map((attendee) => (
                <li key={attendee.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white truncate">
                      {attendee.name} <span className="text-zinc-500 text-xs font-normal">({attendee.email})</span>
                      {attendee.rut && <span className="text-zinc-600 text-xs ml-2 font-normal">RUT: {attendee.rut}</span>}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-1">Ticket:</span>
                        {attendee.ticketSent ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-1">Check-in:</span>
                        {attendee.checkedIn ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {attendees.length === 0 && (
                <li className="px-4 py-8 text-center text-zinc-500">
                  No attendees yet. Upload a CSV to get started.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
