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

  // Logic: Push local pending changes -> API
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
            console.error(`Failed to sync check-in for ${attendee.name}`, error);
        }
    }
  }, [eventId]);

  // Logic: Sync Data form API -> Local DB
  const syncEventData = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    try {
        const response = await api.get(`/events/${eventId}/attendees/sync`);
        const serverAttendees = response.data;
        
        // Bulk put updates existing records by ID, adding new ones
        const attendeesToSave: LocalAttendee[] = (serverAttendees as Omit<LocalAttendee, 'syncStatus'>[]).map(a => ({
            ...a,
            syncStatus: 'synced'
        }));
        
        await db.attendees.bulkPut(attendeesToSave);
        console.log(`Synced ${attendeesToSave.length} attendees`);
        
        // Also push any pending local changes up
        await processPendingSyncs();
        
    } catch (error) {
        console.error("Sync failed:", error);
    } finally {
        setSyncing(false);
    }
  }, [eventId, processPendingSyncs]);

  // Logic: Local Check-in (The Core)
  const handleCheckIn = useCallback(async (attendeeId: string) => {
    setFeedback(null);
    try {
        // 1. Lookup Local
        const attendee = await db.attendees.get(attendeeId);
        
        // 2. Not Found?
        if (!attendee || attendee.eventId !== eventId) {
            setFeedback({ type: 'error', message: 'INVALID Ticket - Not found in this event' });
            return;
        }
        
        // 3. Already Checked In?
        if (attendee.checkedIn) {
            setFeedback({ 
                type: 'warning', 
                message: 'ALREADY INSIDE', 
                attendee 
            });
            return;
        }
        
        // 4. Valid -> Mark Checked In Locally
        await db.attendees.update(attendeeId, { 
            checkedIn: true, 
            checkInTime: new Date(),
            syncStatus: 'pending_checkin' 
        });
        
        const updatedAttendee = await db.attendees.get(attendeeId);
        if (updatedAttendee) {
             setFeedback({ 
                type: 'success', 
                message: 'ACCESS GRANTED', 
                attendee: updatedAttendee 
            });
        }

        // 5. Try Sync Background
        if (navigator.onLine) {
            api.post(`/events/${eventId}/attendees/check-in`, { attendeeId })
               .then(() => db.attendees.update(attendeeId, { syncStatus: 'synced' }))
               .catch(err => console.warn("Background sync failed, queued.", err));
        }

    } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', message: 'System Error' });
    }
  }, [eventId]);

  const onScanSuccess = useCallback((decodedText: string) => {
    if (decodedText !== lastScannedResult) {
      setLastScannedResult(decodedText);
      handleCheckIn(decodedText);
      // Reset scan lock after 3s
      setTimeout(() => setLastScannedResult(null), 3000);
    }
  }, [lastScannedResult, handleCheckIn]);

  // 1. Connectivity & Initial Sync
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
        setIsOnline(true);
        processPendingSyncs();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Sync on load
    syncEventData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processPendingSyncs, syncEventData]);

  // 2. Scanner Setup
  useEffect(() => {
    if (activeTab === 'scan' && !scannerRef.current) {
        // Delay to ensure DOM is ready
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

  // Search Logic
  const handleSearch = async (query: string) => {
      setSearchQuery(query);
      if (!query) {
          setSearchResults([]);
          return;
      }
      
      const q = query.toLowerCase();
      // Dexie filtering
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
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-indigo-700 text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="flex justify-between items-center mb-2">
                <Link href={`/events/${eventId}`} className="text-indigo-200 flex items-center">
                    <ArrowLeft className="h-5 w-5 mr-1" /> Exit
                </Link>
                <div className="flex items-center space-x-3">
                    {syncing && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {isOnline ? (
                        <div className="flex items-center text-green-300 text-sm font-bold">
                            <Wifi className="h-4 w-4 mr-1" /> Online
                        </div>
                     ) : (
                        <div className="flex items-center text-red-300 text-sm font-bold">
                            <WifiOff className="h-4 w-4 mr-1" /> Offline
                        </div>
                     )}
                </div>
            </div>
            <div className="flex space-x-2">
                <button 
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm flex items-center justify-center ${activeTab === 'scan' ? 'bg-white text-indigo-700' : 'bg-indigo-800 text-indigo-200'}`}
                >
                    <Camera className="h-4 w-4 mr-2" /> Scan QR
                </button>
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-2 rounded-md font-medium text-sm flex items-center justify-center ${activeTab === 'search' ? 'bg-white text-indigo-700' : 'bg-indigo-800 text-indigo-200'}`}
                >
                    <Search className="h-4 w-4 mr-2" /> Search
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 max-w-md mx-auto w-full">
            
            {/* Feedback Display */}
            {feedback && (
                <div className={`mb-6 p-6 rounded-xl shadow-lg text-center animate-in fade-in zoom-in duration-300 ${
                    feedback.type === 'success' ? 'bg-green-500 text-white' :
                    feedback.type === 'warning' ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                }`}>
                    <div className="flex justify-center mb-2">
                        {feedback.type === 'success' && <Check className="h-16 w-16" />}
                        {feedback.type === 'warning' && <RefreshCw className="h-16 w-16" />}
                        {feedback.type === 'error' && <X className="h-16 w-16" />}
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-wide mb-2">{feedback.message}</h2>
                    {feedback.attendee && (
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <p className="text-lg font-bold">{feedback.attendee.name}</p>
                            <p className="text-sm opacity-90">{feedback.attendee.email}</p>
                            <p className="text-xs uppercase mt-1 opacity-75">{feedback.attendee.rut}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scan' && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden p-4">
                     <div id="reader" className="w-full rounded-lg overflow-hidden bg-black"></div>
                     <p className="text-center text-gray-500 text-sm mt-4">Point camera at the QR code</p>
                </div>
            )}

            {activeTab === 'search' && (
                <div className="space-y-4">
                    <input 
                        type="search" 
                        placeholder="Search Name, Email or RUT..." 
                        className="w-full p-4 rounded-xl border-gray-300 shadow-sm text-lg"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        autoFocus
                    />
                    
                     <div className="space-y-2">
                        {searchResults.map(attendee => (
                            <div 
                                key={attendee.id} 
                                onClick={() => handleCheckIn(attendee.id)}
                                className={`p-4 rounded-lg bg-white shadow-sm flex justify-between items-center cursor-pointer ${attendee.checkedIn ? 'opacity-60 bg-gray-50' : 'hover:bg-indigo-50 border border-transparent hover:border-indigo-200'}`}
                            >
                                <div>
                                    <p className="font-bold text-gray-900">{attendee.name}</p>
                                    <p className="text-sm text-gray-500">{attendee.email}</p>
                                </div>
                                <div>
                                    {attendee.checkedIn ? (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">IN</span>
                                    ) : (
                                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                            <Check className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {searchQuery && searchResults.length === 0 && (
                            <div className="text-center text-gray-500 py-8">No results found</div>
                        )}
                     </div>
                </div>
            )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
