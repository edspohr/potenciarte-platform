'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Check, X, Camera, Search, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { Attendee } from '@/types';

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  // State
  const [activeTab, setActiveTab] = useState<'scan' | 'search'>('scan');
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [searching, setSearching] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    attendee?: Partial<Attendee>;
  } | null>(null);
  const [history, setHistory] = useState<Attendee[]>([]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleCheckIn = useCallback(async (attendeeId: string) => {
    setFeedback(null);
    try {
      const response = await api.post(`/events/${eventId}/attendees/check-in`, {
        attendeeId,
      });

      const data = response.data;

      if (data.status === 'already_checked_in') {
        setFeedback({
          type: 'warning',
          message: 'YA INGRESÓ',
          attendee: data,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'ACCESO PERMITIDO',
          attendee: data,
        });
        // Add to history if successful
        setHistory(prev => [data as Attendee, ...prev.slice(0, 4)]);
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number } }).response;
        const status = response?.status;
        if (status === 400) {
          setFeedback({ type: 'error', message: 'TICKET INVÁLIDO' });
        } else {
          setFeedback({ type: 'error', message: 'Error de Conexión' });
        }
      } else {
        setFeedback({ type: 'error', message: 'Error de Conexión' });
      }
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
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/events/${eventId}/attendees/search`, {
        params: { q: query },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)] flex flex-col text-white pb-10">
        {/* Header */}
        <div className="border-b border-[var(--border)] glass sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-md mx-auto p-4">
              <div className="flex justify-between items-center mb-6">
                  <Link href={`/events/${eventId}`} className="text-zinc-500 hover:text-white transition-colors flex items-center text-xs font-bold uppercase tracking-wider gap-1.5">
                      <ArrowLeft className="h-4 w-4" /> Regresar
                  </Link>
                  <p className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-orange-500/20">Control de Acceso</p>
              </div>
              <div className="flex p-1 bg-[var(--surface-1)] rounded-xl border border-[var(--border)]">
                  <button
                      onClick={() => setActiveTab('scan')}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${activeTab === 'scan' ? 'bg-[var(--surface-3)] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                      <Camera className="h-4 w-4 mr-2" /> Escanear QR
                  </button>
                  <button
                      onClick={() => setActiveTab('search')}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${activeTab === 'search' ? 'bg-[var(--surface-3)] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                      <Search className="h-4 w-4 mr-2" /> Buscar Manual
                  </button>
              </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 max-w-md mx-auto w-full mt-4">

            {/* Feedback Display */}
            {feedback && (
                <div className={`mb-8 p-8 rounded-3xl shadow-2xl text-center border-2 animate-scaleIn ${
                    feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                    feedback.type === 'warning' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' :
                    'bg-red-500/10 border-red-500/40 text-red-400'
                }`}>
                    <div className="flex justify-center mb-5">
                        <div className={`p-4 rounded-full ${
                          feedback.type === 'success' ? 'bg-emerald-500/20' :
                          feedback.type === 'warning' ? 'bg-amber-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {feedback.type === 'success' && <Check className="h-10 w-10" />}
                          {feedback.type === 'warning' && <AlertTriangle className="h-10 w-10" />}
                          {feedback.type === 'error' && <X className="h-10 w-10" />}
                        </div>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-4">{feedback.message}</h2>
                    {feedback.attendee && (
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-2">
                            <p className="text-lg font-bold text-white">{feedback.attendee.name}</p>
                            <p className="text-xs text-zinc-500 font-medium">{feedback.attendee.email}</p>
                            {feedback.attendee.rut && (
                              <div className="mt-3 inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-orange-500/80">{feedback.attendee.rut}</p>
                              </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scan' && (
                <div className="space-y-8 animate-fadeIn">
                     <div className="bg-[var(--surface-1)] rounded-3xl shadow-xl overflow-hidden border border-[var(--border)] p-2">
                        <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black border border-zinc-900 shadow-inner"></div>
                     </div>
                     
                     {/* Recently Scanned History */}
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Últimos Ingresos</h3>
                        {history.length === 0 ? (
                           <p className="text-center py-8 text-zinc-700 text-xs italic border border-dashed border-zinc-900 rounded-2xl">Esperando escaneos...</p>
                        ) : (
                           <div className="space-y-2">
                              {history.map((a) => (
                                 <div key={a.id} className="premium-card p-3 flex items-center justify-between hover:translate-y-0 animate-slideRight">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                          <Check className="w-4 h-4" />
                                       </div>
                                       <div>
                                          <p className="text-xs font-bold text-white">{a.name}</p>
                                          <p className="text-[10px] text-zinc-600">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                       </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase border border-emerald-500/10">OK</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="relative group">
                        <input
                            type="search"
                            placeholder="Nombre, Email o RUT..."
                            className="w-full p-4 pl-12 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] text-white shadow-lg text-lg focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none placeholder:text-zinc-600"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                    </div>

                     <div className="space-y-3">
                        {searching && (
                            <div className="text-center text-zinc-600 py-10 animate-pulse text-sm font-medium">Buscando en la base de datos...</div>
                        )}
                        {searchResults.map((attendee, index) => (
                            <div
                                key={attendee.id}
                                onClick={() => !attendee.checkedIn && handleCheckIn(attendee.id)}
                                className={`p-4 rounded-2xl border transition-all duration-300 flex justify-between items-center shadow-lg stagger-${index+1} animate-slideUp ${
                                  attendee.checkedIn 
                                    ? 'bg-zinc-900/40 border-zinc-800/50 opacity-50 cursor-default' 
                                    : 'bg-[var(--surface-1)] border-[var(--border)] hover:border-orange-500/40 hover:bg-[var(--surface-2)] cursor-pointer active:scale-95'
                                }`}
                            >
                                <div className="min-w-0 flex-1 pr-4">
                                    <p className="font-bold text-white truncate">{attendee.name}</p>
                                    <p className="text-[11px] text-zinc-500 truncate">{attendee.email}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    {attendee.checkedIn ? (
                                        <div className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-1 rounded-md font-black border border-emerald-500/20 uppercase tracking-wider">Ya ingresó</div>
                                    ) : (
                                        <div className="h-10 w-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-glow transition-all group-hover:bg-orange-500 group-hover:text-white">
                                            <Check className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searchQuery && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                            <div className="text-center text-zinc-700 py-16 animate-fadeIn">
                                <Users className="w-10 h-10 mx-auto mb-4 text-zinc-800" />
                                <p className="text-sm italic font-medium">No se encontraron registros</p>
                            </div>
                        )}
                     </div>
                </div>
            )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
