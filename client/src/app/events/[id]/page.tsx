'use client';

import { useState, useEffect, use, useCallback } from 'react';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event, Attendee } from '@/types';
import { Upload, Mail, Check, ArrowLeft, Camera, FileText, Send, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Spinner from '@/components/Spinner';

export default function EventDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      toast.success('Asistentes cargados exitosamente');
      fetchAttendees();
      fetchEventDetails(); 
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir CSV');
    } finally {
      setUploading(false);
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
      toast.success('Plantilla de diploma subida exitosamente');
      fetchEventDetails();
    } catch (error) {
      console.error('Error uploading template:', error);
      toast.error('Error al subir plantilla');
    } finally {
      setUploadingTemplate(false);
      e.target.value = '';
    }
  };

  const handleSendDiplomas = async () => {
    if (!confirm('¿Estás seguro de enviar diplomas a todos los asistentes acreditados?')) return;
    
    setSendingDiplomas(true);
    try {
      const response = await api.post(`/events/${id}/diplomas/send-batch`);
      toast.success(`Proceso iniciado: ${response.data.message}`);
    } catch (error) {
      console.error('Error sending diplomas:', error);
      toast.error('Error al enviar diplomas');
    } finally {
      setSendingDiplomas(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#09090b]"><Spinner /></div>;
  if (!event) return <div className="text-white text-center mt-10">Evento no encontrado</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-zinc-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                {event.name}
              </h1>
              <div className="flex space-x-3">
                 <Link
                   href={`/events/${id}/check-in`}
                   className="flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                 >
                   <Camera className="w-4 h-4 mr-2" />
                   Ir a Check-in
                 </Link>
              </div>
            </div>
            <p className="text-zinc-400 mt-2">{event.location} • {new Date(event.eventDate).toLocaleDateString('es-CL')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
              <h3 className="text-zinc-400 text-sm mb-1">Total Asistentes</h3>
              <p className="text-3xl font-bold text-white">{attendees.length}</p>
            </div>
            <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
              <h3 className="text-zinc-400 text-sm mb-1">Acreditados</h3>
              <p className="text-3xl font-bold text-green-500">
                {attendees.filter(a => a.checkedIn).length}
              </p>
            </div>
            <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
              <h3 className="text-zinc-400 text-sm mb-1">Diplomas Enviados</h3>
              <p className="text-3xl font-bold text-blue-500">
                {attendees.filter(a => a.diplomaSent).length}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-[#18181b] p-1 rounded-lg mb-6 w-fit border border-[#27272a]">
            <button
              onClick={() => setActiveTab('attendees')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'attendees' 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Asistentes
            </button>
            <button
              onClick={() => setActiveTab('diplomas')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'diplomas' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Diplomas
            </button>
          </div>

          {/* Content */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 min-h-[400px]">
            {activeTab === 'attendees' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Lista de Asistentes</h2>
                  <label className={`cursor-pointer flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Subiendo...' : 'Subir CSV'}
                    <input type="file" accept=".csv" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#27272a] text-zinc-400 text-sm">
                        <th className="pb-3 pl-2">Nombre</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">Diploma</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {attendees.map((attendee) => (
                        <tr key={attendee.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3 pl-2">{attendee.name}</td>
                          <td className="py-3 text-zinc-400">{attendee.email}</td>
                          <td className="py-3">
                            {attendee.checkedIn ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                <Check className="w-3 h-3 mr-1" /> Acreditado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                Pendiente
                              </span>
                            )}
                          </td>
                           <td className="py-3">
                            {attendee.diplomaSent ? (
                              <span className="text-blue-400 text-xs flex items-center"><Mail className="w-3 h-3 mr-1"/> Enviado</span>
                            ) : (
                              <span className="text-zinc-600 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {attendees.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-zinc-500">
                            No hay asistentes registrados. Sube un archivo CSV para comenzar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'diplomas' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Gestión de Diplomas</h2>
                    <p className="text-zinc-400 text-sm">Sube una plantilla PDF y envía los diplomas a los asistentes acreditados.</p>
                  </div>
                  <div className="flex gap-3">
                     <label className={`cursor-pointer flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors ${uploadingTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      {uploadingTemplate ? 'Subiendo...' : 'Subir Plantilla (PDF)'}
                      <input type="file" accept="application/pdf" onChange={handleTemplateUpload} disabled={uploadingTemplate} className="hidden" />
                    </label>
                    <button 
                      onClick={handleSendDiplomas}
                      disabled={sendingDiplomas || !event.diplomaTemplateUrl}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendingDiplomas ? 'Enviando...' : 'Enviar a Todos'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Template Status */}
                  <div className="bg-[#09090b] rounded-lg p-6 border border-[#27272a]">
                     <h3 className="font-semibold mb-4 flex items-center">
                       <FileText className="w-4 h-4 mr-2 text-zinc-400" />
                       Estado de Plantilla
                     </h3>
                     {event.diplomaTemplateUrl ? (
                       <div className="text-green-400 flex items-center bg-green-900/10 p-4 rounded-lg border border-green-900/20">
                         <Check className="w-5 h-5 mr-3" />
                         <div>
                           <p className="font-medium">Plantilla cargada exitosamente</p>
                           <p className="text-xs opacity-80 mt-1">Lista para generar diplomas</p>
                         </div>
                       </div>
                     ) : (
                       <div className="text-zinc-500 bg-zinc-800/50 p-6 rounded-lg border border-zinc-800 text-center">
                         <p>No se ha cargado ninguna plantilla.</p>
                         <p className="text-sm mt-2">Sube un archivo PDF para habilitar el envío.</p>
                       </div>
                     )}
                  </div>

                   {/* Preview (Placeholder) */}
                   <div className="bg-[#09090b] rounded-lg p-6 border border-[#27272a] flex flex-col justify-center items-center text-center opacity-50">
                      <Eye className="w-8 h-8 text-zinc-600 mb-3" />
                      <h3 className="font-semibold mb-1">Vista Previa</h3>
                      <p className="text-sm text-zinc-500">La vista previa del diploma estará disponible próximamente.</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
