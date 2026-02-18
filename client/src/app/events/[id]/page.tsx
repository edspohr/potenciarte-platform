'use client';

import { useState, useEffect, useCallback, use } from 'react';
import api from '../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Users, CheckCircle, Upload, Send, QrCode,
  Calendar, MapPin, FileText, Award, Eye, UserCheck,
  Settings, Mail, Shield, BarChart, ChevronRight, X
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { Event, Attendee, User } from '@/types'; // Update types index to export User

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

const STEPS = [
  { id: 1, title: 'Configuración', icon: Settings },
  { id: 2, title: 'Asistentes', icon: Users },
  { id: 3, title: 'Invitaciones', icon: Mail },
  { id: 4, title: 'Staff', icon: Shield },
  { id: 5, title: 'Diplomas', icon: FileText },
  { id: 6, title: 'Enviar', icon: Send },
  { id: 7, title: 'Informe', icon: BarChart },
];

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { role } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Specific Step States
  const [staffList, setStaffList] = useState<User[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);

  // Common UI States
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Edit Event State
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    eventDate: '',
    diplomaEnabled: false,
  });

  const fetchAll = useCallback(async () => {
    try {
      const [eventRes, attendeesRes, statsRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/attendees`),
        api.get(`/events/${eventId}/attendees/stats`),
      ]);
      setEvent(eventRes.data);
      setAttendees(attendeesRes.data);
      setStats(statsRes.data);
      
      // Initialize edit form
      setEditForm({
        name: eventRes.data.name,
        location: eventRes.data.location,
        eventDate: new Date(eventRes.data.eventDate).toISOString().slice(0, 16),
        diplomaEnabled: eventRes.data.diplomaEnabled || false,
      });

      // Initialize assigned staff
      setAssignedStaff(eventRes.data.staffIds || []);

    } catch (error: any) {
      console.error('Error loading:', error);
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Error al cargar datos del evento');
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [eventId, fetchAll]);

  // Fetch users when entering Staff step
  useEffect(() => {
    if (currentStep === 4 && role === 'ADMIN') {
      const fetchStaff = async () => {
        try {
          const res = await api.get('/users');
          // Filter only STAFF or ADMIN users
          const eligibleStaff = res.data.filter((u: any) => u.role === 'STAFF' || u.role === 'ADMIN');
          setStaffList(eligibleStaff);
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error('Error al cargar lista de staff');
        }
      };
      fetchStaff();
    }
  }, [currentStep, role]);

  const handleUpdateEvent = async () => {
    try {
      await api.patch(`/events/${eventId}`, {
        ...editForm,
        eventDate: new Date(editForm.eventDate).toISOString(),
        staffIds: assignedStaff, // Save staff IDs as well
      });
      toast.success('Evento actualizado correctamente');
      fetchAll();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Error al actualizar evento');
    }
  };

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

  // Staff Assignment Logic
  const toggleStaffAssignment = (userId: string) => {
    setAssignedStaff(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const saveStaffAssignment = async () => {
    try {
      await api.patch(`/events/${eventId}`, { staffIds: assignedStaff });
      toast.success('Asignación de staff guardada');
      fetchAll();
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('Error al guardar asignación');
    }
  };

  if (loading) return <ProtectedRoute><div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><Spinner /></div></ProtectedRoute>;
  
  if (notFound || !event) return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
        <Link href="/dashboard" className="text-orange-500 hover:underline">Volver al Dashboard</Link>
      </div>
    </ProtectedRoute>
  );

  const filteredAttendees = attendees.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] text-white flex flex-col">
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-1)] sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 py-4">
             <div className="flex items-center gap-4 mb-4">
               <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <ArrowLeft className="w-5 h-5 text-gray-400" />
               </Link>
               <div>
                 <h1 className="text-xl font-bold">{event.name}</h1>
                 <p className="text-xs text-gray-500">Gestión Integral del Evento</p>
               </div>
               <div className="ml-auto flex gap-3">
                 <Link
                   href={`/events/${eventId}/check-in`}
                   className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/20"
                 >
                   <QrCode className="w-4 h-4" /> Check-in
                 </Link>
               </div>
             </div>
             
             {/* Stepper Navigation */}
             {role === 'ADMIN' && (
               <div className="flex items-center overflow-x-auto no-scrollbar gap-2 pb-2">
                 {STEPS.map((step) => {
                   const isActive = currentStep === step.id;
                   const isCompleted = currentStep > step.id;
                   return (
                     <button
                       key={step.id}
                       onClick={() => setCurrentStep(step.id)}
                       className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                         isActive 
                           ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20 ring-1 ring-orange-400/50' 
                           : isCompleted
                             ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                             : 'bg-[var(--surface-2)] text-gray-400 hover:text-white hover:bg-[var(--surface-3)]'
                       }`}
                     >
                       <step.icon className={`w-4 h-4 ${isActive ? 'text-white' : isCompleted ? 'text-emerald-500' : 'text-gray-500'}`} />
                       {step.title}
                       {isCompleted && <CheckCircle className="w-3.5 h-3.5 ml-1 text-emerald-500" />}
                     </button>
                   );
                 })}
               </div>
             )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-6 animate-fadeIn">
          
          {/* STEP 1: CONFIGURATION */}
          {currentStep === 1 && (
            <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border)] pb-4">
                 <div className="p-2 bg-orange-500/20 rounded-lg"><Settings className="w-5 h-5 text-orange-500"/></div>
                 <h2 className="text-lg font-bold">Configuración General</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Nombre del Evento</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Ubicación</label>
                  <input 
                    type="text" 
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    value={editForm.eventDate}
                    onChange={(e) => setEditForm({...editForm, eventDate: e.target.value})}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all [color-scheme:dark]"
                  />
                </div>
                 <div className="flex items-center gap-4 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                   <div className="flex-1">
                     <p className="font-bold text-sm">Habilitar Diplomas Digitales</p>
                     <p className="text-xs text-gray-500">Permite enviar certificados a los asistentes.</p>
                   </div>
                   <input 
                     type="checkbox"
                     checked={editForm.diplomaEnabled}
                     onChange={(e) => setEditForm({...editForm, diplomaEnabled: e.target.checked})}
                     className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                   />
                 </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleUpdateEvent} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all">Guardar Cambios</button>
              </div>
            </div>
          )}

          {/* STEP 2: ATTENDEES */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--surface-1)] p-4 rounded-2xl border border-[var(--border)]">
                 <div className="relative w-full md:w-96">
                   <input
                     type="text"
                     placeholder="Buscar asistente..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm focus:border-orange-500/50 outline-none transition-all"
                   />
                   <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                 </div>
                 <label className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-violet-600/10 text-violet-400 border border-violet-600/20 rounded-xl hover:bg-violet-600/20 transition-all font-bold text-sm">
                   <Upload className="w-4 h-4" />
                   {uploading ? 'Cargando...' : 'Cargar CSV'}
                   <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={uploading} />
                 </label>
              </div>

               <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] overflow-hidden">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-[var(--surface-2)] text-gray-400 border-b border-[var(--border)]">
                     <tr>
                       <th className="px-6 py-4 font-medium">Nombre</th>
                       <th className="px-6 py-4 font-medium hidden md:table-cell">Email</th>
                       <th className="px-6 py-4 font-medium text-center">Estado</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                     {filteredAttendees.length === 0 ? (
                       <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay asistentes encontrados.</td></tr>
                     ) : (
                       filteredAttendees.map(a => (
                         <tr key={a.id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                           <td className="px-6 py-4 font-medium">{a.name}</td>
                           <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{a.email}</td>
                           <td className="px-6 py-4 text-center">
                             {a.checkedIn ? (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                 <CheckCircle className="w-3 h-3" /> Validado
                               </span>
                             ) : (
                               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">Pendiente</span>
                             )}
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* STEP 3: INVITES */}
          {currentStep === 3 && (
            <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-8 text-center max-w-2xl mx-auto">
               <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Mail className="w-10 h-10 text-blue-500" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Enviar Invitaciones</h2>
               <p className="text-gray-400 mb-8 max-w-md mx-auto">
                 Se enviará un correo electrónico a todos los asistentes ({attendees.length}) con su código QR único para el ingreso.
               </p>
               <button 
                 onClick={handleSendInvitations}
                 className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
               >
                 <Send className="w-4 h-4" /> Enviar Correos Ahora
               </button>
            </div>
          )}

          {/* STEP 4: STAFF ASSIGNMENT */}
          {currentStep === 4 && (
            <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-500" /> 
                  Asignar Staff al Evento
                </h2>
                <button onClick={saveStaffAssignment} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all">
                  Guardar Asignación
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Available Staff */}
                 <div>
                   <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Usuarios Disponibles</h3>
                   <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] max-h-96 overflow-y-auto p-2 space-y-2">
                     {staffList.filter(u => !assignedStaff.includes(u.id)).length === 0 && (
                       <p className="text-center py-8 text-gray-500 text-sm">No hay más usuarios disponibles.</p>
                     )}
                     {staffList.filter(u => !assignedStaff.includes(u.id)).map(u => (
                       <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] group">
                         <div>
                            <p className="font-medium text-sm">{u.fullName || 'Sin nombre'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                         </div>
                         <button onClick={() => toggleStaffAssignment(u.id)} className="p-2 bg-[var(--surface-2)] hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg transition-colors">
                           <ChevronRight className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Assigned Staff */}
                 <div>
                   <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Asignados ({assignedStaff.length})</h3>
                   <div className="bg-emerald-900/10 rounded-xl border border-emerald-500/20 max-h-96 overflow-y-auto p-2 space-y-2">
                     {assignedStaff.length === 0 && (
                        <p className="text-center py-8 text-emerald-500/40 text-sm">Ningún staff asignado aún.</p>
                     )}
                     {staffList.filter(u => assignedStaff.includes(u.id)).map(u => (
                       <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                         <div>
                            <p className="font-medium text-sm text-emerald-100">{u.fullName || 'Sin nombre'}</p>
                            <p className="text-xs text-emerald-400/70">{u.email}</p>
                         </div>
                         <button onClick={() => toggleStaffAssignment(u.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-emerald-600">
                           <X className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 5: DIPLOMA SETUP */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6">
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <Upload className="w-5 h-5 text-indigo-500" /> Cargar Plantilla
                 </h2>
                 <p className="text-sm text-gray-400 mb-6">El sistema centrará automáticamente el nombre del asistente en el PDF que subas.</p>
                 
                 <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl hover:bg-[var(--surface-2)] cursor-pointer transition-colors group">
                   <div className="flex flex-col items-center justify-center pt-5 pb-6">
                     <FileText className="w-10 h-10 text-gray-500 group-hover:text-indigo-400 mb-3" />
                     <p className="text-sm text-gray-400 group-hover:text-gray-300">
                       <span className="font-semibold">Click para subir</span> o arrastra un PDF
                     </p>
                     <p className="text-xs text-gray-600 mt-1">PDF (MAX. 5MB)</p>
                   </div>
                   <input type="file" className="hidden" accept=".pdf" onChange={handleTemplateUpload} />
                 </label>
               </div>

               <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-6 flex flex-col items-center justify-center text-center">
                 {event.diplomaTemplateUrl ? (
                   <>
                     <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                     <h3 className="text-xl font-bold text-white mb-2">Plantilla Activa</h3>
                     <p className="text-gray-400 mb-6 text-sm">Tu diploma está listo para ser generado.</p>
                     <a
                       href={`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/diplomas/preview`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                     >
                       <Eye className="w-4 h-4" /> Ver Preview con Datos Ficticios
                     </a>
                   </>
                 ) : (
                   <>
                     <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                       <FileText className="w-8 h-8 text-gray-600" />
                     </div>
                     <p className="text-gray-500 font-medium">Aún no has subido una plantilla.</p>
                   </>
                 )}
               </div>
            </div>
          )}

          {/* STEP 6: SEND DIPLOMAS */}
          {currentStep === 6 && (
            <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-8 text-center max-w-2xl mx-auto">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Award className="w-10 h-10 text-emerald-500" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Enviar Diplomas</h2>
               <p className="text-gray-400 mb-8 max-w-md mx-auto">
                 Se enviará el diploma generado a los <strong>{stats?.checkedIn || 0}</strong> asistentes que han validado su ingreso (Check-in).
               </p>
               
               <div className="flex flex-col gap-4 max-w-xs mx-auto">
                 <button 
                   onClick={handleSendDiplomas}
                   disabled={!event.diplomaTemplateUrl || stats?.checkedIn === 0 || sending}
                   className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                 >
                   {sending ? <Spinner /> : <><Send className="w-4 h-4" /> Enviar a Todos</>}
                 </button>
                 {!event.diplomaTemplateUrl && (
                   <p className="text-xs text-red-400">⚠️ Falta cargar la plantilla en el paso anterior.</p>
                 )}
               </div>
            </div>
          )}

          {/* STEP 7: REPORT */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border)]">
                   <p className="text-sm text-gray-400 mb-1">Total Confirmados</p>
                   <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
                 </div>
                 <div className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border)]">
                   <p className="text-sm text-gray-400 mb-1">Total Asistieron</p>
                   <p className="text-3xl font-bold text-emerald-400">{stats?.checkedIn || 0}</p>
                 </div>
                 <div className="bg-[var(--surface-1)] p-6 rounded-2xl border border-[var(--border)]">
                   <p className="text-sm text-gray-400 mb-1">Porcentaje Asistencia</p>
                   <p className="text-3xl font-bold text-orange-400">
                     {stats ? Math.round((stats.checkedIn / (stats.total || 1)) * 100) : 0}%
                   </p>
                 </div>
              </div>

               <div className="bg-[var(--surface-1)] p-8 rounded-2xl border border-[var(--border)] text-center">
                 <BarChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                 <h3 className="text-lg font-bold mb-2">Exportar Datos Finales</h3>
                 <p className="text-gray-400 mb-6">Descarga un archivo CSV con el detalle de asistencia, hora de ingreso y estado de envío de diplomas.</p>
                 <button className="px-6 py-2.5 border border-[var(--border)] hover:bg-[var(--surface-2)] text-white font-bold rounded-xl transition-all">
                   Descargar Reporte CSV (Próximamente)
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}
