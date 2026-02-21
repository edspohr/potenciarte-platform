'use client';

import { useState, useEffect, useCallback, use } from 'react';
import api from '../../../lib/api';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Users, CheckCircle, Upload, Send, QrCode,
  Calendar, MapPin, FileText, Award,
  Settings, Mail, Shield, BarChart, ChevronRight, X
} from 'lucide-react';
import Spinner from '@/components/Spinner';
import { Event, Attendee, User } from '@/types';

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { role } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals/Drawers States
  const [activeModal, setActiveModal] = useState<'config' | 'staff' | 'diplomas' | 'attendees' | 'newAttendee' | null>(null);
  
  // Specific Data States
  const [staffList, setStaffList] = useState<User[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [addingAttendee, setAddingAttendee] = useState(false);
  const [newAttendeeForm, setNewAttendeeForm] = useState({ name: '', email: '', org: '' });

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
      setAssignedStaff(eventRes.data.staffIds || []);
      setEditForm({
        name: eventRes.data.name,
        location: eventRes.data.location,
        eventDate: new Date(eventRes.data.eventDate).toISOString().slice(0, 16),
        diplomaEnabled: eventRes.data.diplomaEnabled || false,
      });
    } catch (error) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 404) setNotFound(true);
      else toast.error('Error al cargar datos del evento');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Modals specific side-effects
  useEffect(() => {
    if (activeModal === 'staff' && role === 'ADMIN') {
      const fetchStaff = async () => {
        try {
          const res = await api.get('/users');
          setStaffList(res.data.filter((u: User) => u.role === 'STAFF' || u.role === 'ADMIN'));
        } catch { toast.error('Error al cargar staff'); }
      };
      fetchStaff();
    }
  }, [activeModal, role]);

  const handleUpdateEvent = async () => {
    try {
      await api.patch(`/events/${eventId}`, {
        ...editForm,
        eventDate: new Date(editForm.eventDate).toISOString(),
        staffIds: assignedStaff,
      });
      toast.success('Evento actualizado exitosamente');
      fetchAll();
      setActiveModal(null);
    } catch { toast.error('Error al actualizar evento'); }
  };

  const saveStaffAssignment = async () => {
    try {
      await api.patch(`/events/${eventId}`, { staffIds: assignedStaff });
      toast.success('Asignación de staff guardada');
      fetchAll();
      setActiveModal(null);
    } catch { toast.error('Error al guardar asignación'); }
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
    } catch { toast.error('Error al cargar CSV'); } 
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleAddAttendee = async () => {
    if (!newAttendeeForm.name || !newAttendeeForm.email) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }
    setAddingAttendee(true);
    try {
      await api.post(`/events/${eventId}/attendees`, newAttendeeForm);
      toast.success('Asistente añadido');
      fetchAll();
      setNewAttendeeForm({ name: '', email: '', org: '' });
      setActiveModal('attendees');
    } catch { toast.error('Error al añadir asistente'); }
    finally { setAddingAttendee(false); }
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
    } catch { toast.error('Error al subir plantilla'); }
  };

  const handleSendDiplomas = async () => {
    if (!confirm('¿Enviar diplomas a todos los asistentes válidos?')) return;
    setSending(true);
    try {
      const response = await api.post(`/events/${eventId}/diplomas/send-batch`);
      toast.success(`${response.data.sent} diplomas enviados`);
    } catch { toast.error('Error al enviar diplomas'); } 
    finally { setSending(false); }
  };
  
  const handleSendInvitations = async () => {
    if (!confirm('¿Enviar correos con QR ticket a los asistentes?')) return;
    try {
      await api.post(`/events/${eventId}/invitations`);
      toast.success('Invitaciones enviadas');
    } catch { toast.error('Error al enviar invitaciones'); }
  };

  if (loading) return <MainLayout><div className="flex h-[80vh] items-center justify-center"><Spinner /></div></MainLayout>;
  if (notFound || !event) return <MainLayout><div className="flex h-[80vh] items-center justify-center text-zinc-500">Evento no encontrado</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-xl transition-colors border border-[var(--border)] group">
              <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-bold tracking-tight text-white">{event.name}</h1>
                 {event.status === 'PUBLISHED' && <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">En Curso</span>}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {new Date(event.eventDate).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {event.location}</span>
              </div>
            </div>
          </div>
          
          <Link
             href={`/events/${eventId}/check-in`}
             className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20"
          >
             <QrCode className="w-5 h-5" /> Iniciar Check-in
          </Link>
        </div>

        {/* Global Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-[var(--surface-1)] border border-[var(--border)] p-6 rounded-3xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="relative z-10">
                 <p className="text-sm text-zinc-400 font-medium mb-1 flex items-center gap-2"><Users className="w-4 h-4"/> Total Registrados</p>
                 <p className="text-4xl font-black text-white">{stats?.total || 0}</p>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform"><Users className="w-32 h-32"/></div>
           </div>
           <div className="bg-[var(--surface-1)] border border-[var(--border)] p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="relative z-10">
                 <p className="text-sm text-zinc-400 font-medium mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Check-in Exitoso</p>
                 <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-emerald-400">{stats?.checkedIn || 0}</p>
                    <span className="text-sm font-bold text-emerald-500/50">
                       {stats?.total ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%
                    </span>
                 </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle className="w-32 h-32"/></div>
           </div>
           <div className="bg-[var(--surface-1)] border border-[var(--border)] p-6 rounded-3xl relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-sm text-zinc-400 font-medium mb-1 flex items-center gap-2"><BarChart className="w-4 h-4 text-blue-500"/> Operaciones</p>
                 <button className="mt-2 w-full py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-xl text-sm font-bold text-white transition-colors border border-[var(--border)]">
                    Descargar Exportable CSV
                 </button>
              </div>
           </div>
        </div>

        {/* Control Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
           {/* Modulo 1: Configuracion */}
           <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-6 flex flex-col hover:border-zinc-700 transition-colors">
             <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mb-5 shrink-0">
                <Settings className="w-6 h-6 text-zinc-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Ajustes Base</h3>
             <p className="text-sm text-zinc-500 mb-6 flex-1">Modifica nombre, fecha, lugar o habilita los diplomas para este evento.</p>
             <button onClick={() => setActiveModal('config')} className="w-full py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-xl text-sm font-bold transition-colors">
               Editar Configuración
             </button>
           </div>

           {/* Modulo 2: Asistentes e Invitaciones */}
           <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-6 flex flex-col lg:col-span-2 hover:border-zinc-700 transition-colors">
             <div className="flex items-start justify-between mb-5">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-blue-500" />
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setActiveModal('newAttendee')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors">
                   + Nuevo
                 </button>
                 <button onClick={() => setActiveModal('attendees')} className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-xs font-bold transition-colors">
                   Ver Directorio
                 </button>
               </div>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Asistentes & Accesos</h3>
             <p className="text-sm text-zinc-500 mb-6 flex-1">Carga el listado (CSV) y envía a todos su ticket QR de acceso personalizado.</p>
             
             <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer flex items-center justify-center gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-500/20 rounded-xl text-sm font-bold transition-all">
                   <Upload className="w-4 h-4" /> {uploading ? 'Cargando...' : 'Subir CSV'}
                   <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={uploading} />
                </label>
                <button onClick={handleSendInvitations} className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-blue-900/20">
                   <Send className="w-4 h-4" /> Enviar Invitaciones
                </button>
             </div>
           </div>

           {/* Modulo 3: Diplomas */}
           <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-6 flex flex-col hover:border-zinc-700 transition-colors">
             <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 shrink-0">
                <FileText className="w-6 h-6 text-purple-400" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Plantilla de Diploma</h3>
             <p className="text-sm text-zinc-500 mb-6 flex-1">
               {event.diplomaTemplateUrl 
                 ? 'Plantilla configurada correctamente. Lista para envío.' 
                 : 'Sube un PDF base para generar diplomas a quienes asistan.'}
             </p>
             <button onClick={() => setActiveModal('diplomas')} className="w-full py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-bold transition-colors">
               Gestionar Diplomas
             </button>
           </div>

           {/* Modulo 4: Envio Diplomas Masivo */}
           <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-6 flex flex-col hover:border-zinc-700 transition-colors">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 shrink-0">
                <Award className="w-6 h-6 text-emerald-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Envío de Diplomas</h3>
             <p className="text-sm text-zinc-500 mb-6 flex-1">Genera y entrega despachos a quienes tienen check-in confirmado.</p>
             <button 
                onClick={handleSendDiplomas}
                disabled={!event.diplomaTemplateUrl || stats?.checkedIn === 0 || sending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-900/20"
             >
               {sending ? <Spinner /> : 'Despachar a Todos'}
             </button>
           </div>

           {/* Modulo 5: Staff */}
           {role === 'ADMIN' && (
             <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-3xl p-6 flex flex-col hover:border-zinc-700 transition-colors">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 shrink-0">
                  <Shield className="w-6 h-6 text-orange-500" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Control Staff</h3>
               <p className="text-sm text-zinc-500 mb-6 flex-1">Acredita personal autorizado para leer QRs en los accesos.</p>
               <button onClick={() => setActiveModal('staff')} className="w-full py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                 Asignar Operarios <ChevronRight className="w-4 h-4"/>
               </button>
             </div>
           )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Modal Base wrapper */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-md h-full bg-[var(--surface-1)] border-l border-[var(--border)] shadow-2xl animate-slideRight flex flex-col">
             <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface-2)]">
               <h2 className="text-lg font-bold text-white">
                 {activeModal === 'config' ? 'Ajustes del Evento' : 
                  activeModal === 'staff' ? 'Asignación de Staff' : 
                  activeModal === 'diplomas' ? 'Configurar Diplomas' : 
                  activeModal === 'newAttendee' ? 'Añadir Asistente' :
                  'Directorio de Asistentes'}
               </h2>
               <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
               
               {/* Configuración */}
               {activeModal === 'config' && (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-400">Nombre del Evento</label>
                       <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-orange-500/50 outline-none text-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-400">Lugar/Dirección</label>
                       <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-orange-500/50 outline-none text-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-zinc-400">Fecha y Hora</label>
                       <input type="datetime-local" value={editForm.eventDate} onChange={e => setEditForm({...editForm, eventDate: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-orange-500/50 outline-none text-white transition-colors [color-scheme:dark]" />
                    </div>
                    <div className="flex items-center justify-between bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] mt-4">
                       <div>
                         <p className="font-bold text-sm text-white">Certificados (Diplomas)</p>
                         <p className="text-xs text-zinc-500">Habilita módulo post-evento</p>
                       </div>
                       <input type="checkbox" checked={editForm.diplomaEnabled} onChange={e => setEditForm({...editForm, diplomaEnabled: e.target.checked})} className="w-5 h-5 accent-orange-500 cursor-pointer" />
                    </div>
                    <button onClick={handleUpdateEvent} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl mt-8 transition-colors shadow-lg">Guardar Cambios</button>
                 </div>
               )}

               {/* Staff */}
               {activeModal === 'staff' && (
                 <div className="space-y-6">
                   <p className="text-sm text-zinc-400">Usuarios con acceso a leer QR y validar ingresos en este evento.</p>
                   <div className="space-y-2">
                     {staffList.map(u => {
                       const isAssigned = assignedStaff.includes(u.id);
                       return (
                         <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isAssigned ? 'bg-orange-500/10 border-orange-500/20' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
                           <div>
                              <p className={`font-bold text-sm ${isAssigned ? 'text-orange-400' : 'text-white'}`}>{u.fullName || (u as User & { displayName?: string, name?: string }).displayName || (u as User & { displayName?: string, name?: string }).name || 'Sin nombre'}</p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                           </div>
                           <button 
                             onClick={() => setAssignedStaff(prev => isAssigned ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isAssigned ? 'bg-orange-500/20 text-orange-500 hover:bg-red-500/20 hover:text-red-400' : 'bg-[var(--surface-3)] text-zinc-400 hover:text-white'}`}
                           >
                             {isAssigned ? 'Quitar' : 'Asignar'}
                           </button>
                         </div>
                       )
                     })}
                   </div>
                   <button onClick={saveStaffAssignment} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 transition-colors">Guardar Asignaciones</button>
                 </div>
               )}

               {/* Diplomas */}
               {activeModal === 'diplomas' && (
                 <div className="space-y-6">
                    {event.diplomaTemplateUrl && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between mb-6">
                         <div className="flex items-center gap-3 text-emerald-500">
                           <CheckCircle className="w-5 h-5"/>
                           <div>
                             <p className="font-bold text-sm">Plantilla Operativa</p>
                           </div>
                         </div>
                         <a href={`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/diplomas/preview`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/30 transition-colors">Ver Ejemplo</a>
                      </div>
                    )}

                    <div className="border-2 border-dashed border-zinc-700 hover:border-purple-500/50 bg-[var(--surface-2)] rounded-3xl p-8 text-center transition-colors group">
                       <input type="file" id="pdf-upload" accept=".pdf" className="hidden" onChange={handleTemplateUpload} />
                       <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-10 h-10 text-zinc-500 group-hover:text-purple-400 mb-3 transition-colors" />
                          <p className="font-bold text-white mb-1">Subir nueva base en PDF</p>
                          <p className="text-xs text-zinc-500">Max. 5MB. Horizontal recomendado.</p>
                       </label>
                    </div>
                 </div>
               )}

               {/* Directorio de Asistentes */}
               {activeModal === 'attendees' && (
                 <div className="flex flex-col h-full">
                    <input type="text" placeholder="Buscar nombre o correo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 mb-4 focus:border-blue-500/50 outline-none text-white text-sm" />
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 border-t border-[var(--border)] pt-4">
                       {attendees.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                         <div className="text-center text-zinc-500 text-sm py-10 italic">No tienes asistentes registrados aún.</div>
                       ) : attendees.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase())).map(a => (
                         <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-white text-sm truncate">{a.name}</p>
                              <p className="text-xs text-zinc-500 truncate">{a.email}</p>
                            </div>
                            <div className="shrink-0">
                               {a.checkedIn ? <CheckCircle className="w-4 h-4 text-emerald-500"/> : <span className="text-[10px] uppercase font-bold text-zinc-500">Pendiente</span>}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {/* Añadir Asistente */}
               {activeModal === 'newAttendee' && (
                 <div className="space-y-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Nombre Completo *</label>
                          <input type="text" placeholder="Ej: Juan Pérez" value={newAttendeeForm.name} onChange={e => setNewAttendeeForm({...newAttendeeForm, name: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-blue-500/50 outline-none text-white transition-colors" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Correo Electrónico *</label>
                          <input type="email" placeholder="Ej: juan@empresa.com" value={newAttendeeForm.email} onChange={e => setNewAttendeeForm({...newAttendeeForm, email: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-blue-500/50 outline-none text-white transition-colors" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Organización (Opcional)</label>
                          <input type="text" placeholder="Ej: Google" value={newAttendeeForm.org} onChange={e => setNewAttendeeForm({...newAttendeeForm, org: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 focus:border-blue-500/50 outline-none text-white transition-colors" />
                       </div>
                    </div>
                    <button onClick={handleAddAttendee} disabled={addingAttendee} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl mt-8 transition-colors shadow-lg">
                      {addingAttendee ? <Spinner /> : 'Guardar y Añadir'}
                    </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
