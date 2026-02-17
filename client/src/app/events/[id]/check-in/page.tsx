'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Check, X, Camera, Search, AlertTriangle } from 'lucide-react';
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
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        setFeedback({ type: 'error', message: 'TICKET INVÁLIDO' });
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
      <div className="min-h-screen bg-[#09090b] flex flex-col text-white">
        {/* Header */}
        <div className="bg-[#121214] text-white p-4 border-b border-[#27272a] shadow-2xl sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
            <div className="flex justify-between items-center mb-4">
                <Link href={`/events/${eventId}`} className="text-zinc-400 hover:text-orange-500 transition-colors flex items-center font-medium">
                    <ArrowLeft className="h-5 w-5 mr-1" /> Salir
                </Link>
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
                <div className={`mb-6 p-6 rounded-2xl shadow-2xl text-center border-2 backdrop-blur-xl ${
                    feedback.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-white' :
                    feedback.type === 'warning' ? 'bg-orange-500/20 border-orange-500/50 text-white' :
                    'bg-red-500/20 border-red-500/50 text-white'
                }`}>
                    <div className="flex justify-center mb-4">
                        {feedback.type === 'success' && <Check className="h-16 w-16 text-green-500" />}
                        {feedback.type === 'warning' && <AlertTriangle className="h-16 w-16 text-orange-500" />}
                        {feedback.type === 'error' && <X className="h-16 w-16 text-red-500" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-widest mb-4">{feedback.message}</h2>
                    {feedback.attendee && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xl font-bold">{feedback.attendee.name}</p>
                            <p className="text-sm text-zinc-400">{feedback.attendee.email}</p>
                            {feedback.attendee.rut && (
                              <p className="text-xs font-mono uppercase mt-2 text-orange-500/80">{feedback.attendee.rut}</p>
                            )}
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
                        {searching && (
                            <div className="text-center text-zinc-500 py-6">Buscando...</div>
                        )}
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
                        {searchQuery && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
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
