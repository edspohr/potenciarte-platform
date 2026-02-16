'use client';



import { useState, useEffect, use, useCallback } from 'react';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event, Attendee } from '@/types';
import { Upload, Mail, Check, ArrowLeft, Camera, FileText, Send, Eye } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'attendees' | 'diplomas'>('attendees');
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [sendingDiplomas, setSendingDiplomas] = useState(false);

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

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingTemplate(true);
    try {
      await api.post(`/events/${id}/diplomas/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Diploma template uploaded successfully!');
      fetchEventDetails();
    } catch (error) {
      console.error('Error uploading template:', error);
      alert('Failed to upload template');
    } finally {
      setUploadingTemplate(false);
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

  const sendDiplomas = async () => {
    if (!confirm('Send diplomas to all checked-in attendees?')) return;

    setSendingDiplomas(true);
    try {
      const response = await api.post(`/events/${id}/diplomas/send-batch`);
      alert(response.data?.message || 'Diplomas sent successfully');
      fetchAttendees();
    } catch (error) {
      console.error('Error sending diplomas:', error);
      alert('Failed to send diplomas');
    } finally {
      setSendingDiplomas(false);
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
              <div className="flex bg-[#27272a] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('attendees')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'attendees'
                      ? 'bg-[#09090b] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Attendees
                </button>
                <button
                  onClick={() => setActiveTab('diplomas')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'diplomas'
                      ? 'bg-[#09090b] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Diplomas
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'attendees' && (
            <>
              <div className="mb-6 flex justify-end gap-3 flex-wrap">
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

              <div className="bg-[#121214] border border-[#27272a] overflow-hidden rounded-xl shadow-2xl">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-[#27272a]">
                  <h3 className="text-lg font-bold text-white">Attendees ({attendees.length})</h3>
                  <div className="text-sm text-zinc-400">
                    Checked In: <span className="font-bold text-orange-500">{attendees.filter(a => a.checkedIn).length}</span> / {attendees.length}
                  </div>
                </div>
                <ul className="divide-y divide-[#27272a]">
                  {attendees.map((attendee) => (
                    <li key={attendee.id} className="px-4 py-4 sm:px-6 hover:bg-[#1f1f22] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-white truncate">
                          {attendee.name} <span className="text-zinc-500 text-xs font-normal">({attendee.email})</span>
                          {attendee.rut && <span className="text-zinc-600 text-xs ml-2 font-normal">RUT: {attendee.rut}</span>}
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center text-sm text-gray-500" title="Invitation Sent">
                            <Mail className={`h-4 w-4 mr-1 ${attendee.ticketSent ? 'text-green-500' : 'text-zinc-600'}`} />
                          </div>
                          <div className="flex items-center text-sm text-gray-500" title="Checked In">
                            <Check className={`h-4 w-4 mr-1 ${attendee.checkedIn ? 'text-green-500' : 'text-zinc-600'}`} />
                          </div>
                          <div className="flex items-center text-sm text-gray-500" title="Diploma Sent">
                            <FileText className={`h-4 w-4 mr-1 ${attendee.diplomaSent ? 'text-green-500' : 'text-zinc-600'}`} />
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
            </>
          )}

          {activeTab === 'diplomas' && (
            <div className="space-y-6">
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Diploma Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Upload Diploma Template (PDF)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-[#27272a] rounded-lg hover:border-orange-500 hover:bg-[#09090b]/50 transition-all cursor-pointer group">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-zinc-500 group-hover:text-orange-500 transition-colors mb-2" />
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-200">
                            {uploadingTemplate ? 'Uploading...' : 'Click to Upload PDF'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleTemplateUpload}
                          disabled={uploadingTemplate}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${event.diplomaTemplateUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                       <span className="text-sm text-zinc-300">
                         Template Status: {event.diplomaTemplateUrl ? 'Uploaded' : 'Not Uploaded'}
                       </span>
                    </div>

                    {event.diplomaTemplateUrl && (
                      <div className="flex flex-wrap gap-4">
                         <a
                           href={`${api.defaults.baseURL}/events/${id}/diplomas/preview`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center px-4 py-2 border border-[#27272a] text-sm font-medium rounded-md text-white bg-[#09090b] hover:bg-zinc-800 transition-colors"
                         >
                           <Eye className="mr-2 h-4 w-4" />
                           Preview Diploma
                         </a>

                         <button
                           onClick={sendDiplomas}
                           disabled={sendingDiplomas}
                           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-lg shadow-indigo-900/20 text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                         >
                           <Send className="mr-2 h-4 w-4" />
                           {sendingDiplomas ? 'Sending...' : `Send to ${attendees.filter(a => a.checkedIn && !a.diplomaSent).length} Attendees`}
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Delivery Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a]">
                      <span className="block text-zinc-500 text-xs uppercase tracking-wider font-bold">Checked In</span>
                      <span className="text-2xl font-bold text-white">{attendees.filter(a => a.checkedIn).length}</span>
                   </div>
                   <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a]">
                      <span className="block text-zinc-500 text-xs uppercase tracking-wider font-bold">Diplomas Sent</span>
                      <span className="text-2xl font-bold text-green-500">{attendees.filter(a => a.diplomaSent).length}</span>
                   </div>
                   <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a]">
                      <span className="block text-zinc-500 text-xs uppercase tracking-wider font-bold">Pending</span>
                      <span className="text-2xl font-bold text-orange-500">{attendees.filter(a => a.checkedIn && !a.diplomaSent).length}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
