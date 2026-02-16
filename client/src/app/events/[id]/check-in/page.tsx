'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Check, X, Camera, RefreshCw, Wifi, WifiOff, Search } from 'lucide-react';
import Link from 'next/link';
import { db, LocalAttendee } from '@/lib/db';

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  
  // State
  const [activeTab, setActiveTab] = useState<'scan' | 'search'>('scan');
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocalAttendee[]>([]);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    attendee?: LocalAttendee;
  } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const processPendingSyncs = useCallback(async () => {
    const pending = await db.attendees
        .where('eventId').equals(eventId)
        .filter(a => a.syncStatus === 'pending_checkin')
        .toArray();
        
    for (const attendee of pending) {
        try {
            await api.post(`/events/${eventId}/attendees/check-in`, { attendeeId: attendee.id });
            await db.attendees.update(attendee.id, { syncStatus: 'synced' });
        } catch (error) {
            console.error(`Error al sincronizar check-in para ${attendee.name}`, error);
        }
    }
  }, [eventId]);

  const syncEventData = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
        const response = await api.get(`/events/${eventId}/attendees/sync`);
        const serverAttendees = response.data;
        
        const attendeesToSave: LocalAttendee[] = (serverAttendees as Omit<LocalAttendee, 'syncStatus'>[]).map(a => ({
            ...a,
            syncStatus: 'synced'
        }));
        
        await db.attendees.bulkPut(attendeesToSave);
        console.log(`Sincronizados ${attendeesToSave.length} asistentes`);
        
        await processPendingSyncs();
        
    } catch (error) {
        console.error("Fallo la sincronización:", error);
    } finally {
        setSyncing(false);
    }
  }, [eventId, processPendingSyncs]);

  const handleCheckIn = useCallback(async (attendeeId: string) => {
    setFeedback(null);
    try {
        const attendee = await db.attendees.get(attendeeId);
        
        if (!attendee || attendee.eventId !== eventId) {
            setFeedback({ type: 'error', message: 'TICKET INVÁLIDO' });
            return;
        }
        
        if (attendee.checkedIn) {
            setFeedback({ 
                type: 'warning', 
                message: 'YA INGRESÓ', 
                attendee 
            });
            return;
        }
        
        await db.attendees.update(attendeeId, { 
            checkedIn: true, 
            checkInTime: new Date(),
            syncStatus: 'pending_checkin' 
        });
        
        const updatedAttendee = await db.attendees.get(attendeeId);
        if (updatedAttendee) {
             setFeedback({ 
                type: 'success', 
                message: 'ACCESO PERMITIDO', 
                attendee: updatedAttendee 
            });
        }

        if (navigator.onLine) {
            api.post(`/events/${eventId}/attendees/check-in`, { attendeeId })
               .then(() => db.attendees.update(attendeeId, { syncStatus: 'synced' }))
               .catch(err => console.warn("Sincronización en segundo plano falló, en cola.", err));
        }

    } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', message: 'Error del Sistema' });
    }
  }, [eventId]);

  const onScanSuccess = useCallback((decodedText: string) => {
    if (decodedText !== lastScannedResult) {
      setLastScannedResult(decodedText);
      handleCheckIn(decodedText);
      setTimeout(() => setLastScannedResult(null), 3000);
    }
  }, [lastScannedResult, handleCheckIn]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
        setIsOnline(true);
        processPendingSyncs();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    syncEventData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processPendingSyncs, syncEventData]);

  useEffect(() => {
    if (activeTab === 'scan' && !scannerRef.current) {
        const timeoutId = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            
            scanner.render(onScanSuccess, () => { /* ignore errors */ });
            scannerRef.current = scanner;
        }, 300);
        return () => clearTimeout(timeoutId);
    }
    
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    };
  }, [activeTab, onScanSuccess]);

  const handleSearch = async (query: string) => {
      setSearchQuery(query);
      if (!query) {
          setSearchResults([]);
          return;
      }
      
      const q = query.toLowerCase();
      const results = await db.attendees
        .where('eventId').equals(eventId)
        .filter(a => 
            a.name.toLowerCase().includes(q) || 
            a.email.toLowerCase().includes(q) || 
            (a.rut || '').toLowerCase().includes(q)
        )
        .limit(10)
        .toArray();
        
      setSearchResults(results);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] flex flex-col text-white">
        {/* Header */}
        <div className="bg-[#121214] text-white p-4 border-b border-[#27272a] shadow-2xl sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
            <div className="flex justify-between items-center mb-4">
                <Link href={`/events/${eventId}`} className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center font-medium">
                    <ArrowLeft className="h-5 w-5 mr-1" /> Salir
                </Link>
                <div className="flex items-center space-x-3">
                    {syncing && <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />}
                    {isOnline ? (
                        <div className="flex items-center text-green-500 text-sm font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <Wifi className="h-3 w-3 mr-1" /> Online
                        </div>
                     ) : (
                        <div className="flex items-center text-orange-500 text-sm font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                            <WifiOff className="h-3 w-3 mr-1" /> Offline
                        </div>
                     )}
                </div>
            </div>
            <div className="flex p-1 bg-[#09090b] rounded-lg border border-[#27272a]">
                <button 
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm flex items-center justify-center transition-all ${activeTab === 'scan' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Camera className="h-4 w-4 mr-2" /> Escanear QR
                </button>
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-2 rounded-md font-bold text-sm flex items-center justify-center transition-all ${activeTab === 'search' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                >
                    <Search className="h-4 w-4 mr-2" /> Buscar
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 max-w-md mx-auto w-full">
            
            {/* Feedback Display */}
            {feedback && (
                <div className={`mb-6 p-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in duration-300 border-2 backdrop-blur-xl ${
                    feedback.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-white' :
                    feedback.type === 'warning' ? 'bg-orange-500/20 border-orange-500/50 text-white' :
                    'bg-red-500/20 border-red-500/50 text-white'
                }`}>
                    <div className="flex justify-center mb-4">
                        {feedback.type === 'success' && <Check className="h-16 w-16 text-green-500" />}
                        {feedback.type === 'warning' && <RefreshCw className="h-16 w-16 text-orange-500" />}
                        {feedback.type === 'error' && <X className="h-16 w-16 text-red-500" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-widest mb-4">{feedback.message}</h2>
                    {feedback.attendee && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xl font-bold">{feedback.attendee.name}</p>
                            <p className="text-sm text-zinc-400">{feedback.attendee.email}</p>
                            <p className="text-xs font-mono uppercase mt-2 text-orange-500/80">{feedback.attendee.rut}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scan' && (
                <div className="bg-[#121214] rounded-2xl shadow-xl overflow-hidden p-4 border border-[#27272a]">
                     <div id="reader" className="w-full rounded-xl overflow-hidden bg-black border border-zinc-800"></div>
                     <p className="text-center text-zinc-500 text-sm mt-6 font-medium">Listo para escanear</p>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="space-y-6">
                    <div className="relative">
                        <input 
                            type="search" 
                            placeholder="Buscar Nombre, Email o RUT..." 
                            className="w-full p-4 pl-12 rounded-xl bg-[#121214] border border-[#27272a] text-white shadow-lg text-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    </div>
                    
                     <div className="space-y-3">
                        {searchResults.map(attendee => (
                            <div 
                                key={attendee.id} 
                                onClick={() => handleCheckIn(attendee.id)}
                                className={`p-4 rounded-xl border transition-all duration-200 flex justify-between items-center cursor-pointer shadow-sm ${attendee.checkedIn ? 'bg-[#121214]/50 border-zinc-900 opacity-60' : 'bg-[#121214] border-[#27272a] hover:border-orange-500/50 hover:bg-[#1a1a1c]'}`}
                            >
                                <div>
                                    <p className="font-bold text-white">{attendee.name}</p>
                                    <p className="text-sm text-zinc-400">{attendee.email}</p>
                                </div>
                                <div className="flex items-center">
                                    {attendee.checkedIn ? (
                                        <div className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-md font-black border border-green-500/20">VALIDADO</div>
                                    ) : (
                                        <div className="h-10 w-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/20 transform hover:scale-110 transition-transform">
                                            <Check className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searchQuery && searchResults.length === 0 && (
                            <div className="text-center text-zinc-500 py-12 italic">No se encontraron asistentes</div>
                        )}
                     </div>
                </div>
            )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
