'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Check, X, Camera } from 'lucide-react';
import Link from 'next/link';
import { Attendee } from '@/types';

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    attendee?: Attendee;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize Scanner
    // Use a slight delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
        );
        
        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;
    }, 100);

    return () => {
        clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
            console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, []);

  const onScanSuccess = (decodedText: string, decodedResult: any) => {
    // Prevent multiple scans of the same code in rapid succession
    if (decodedText !== lastScannedResult) {
      setLastScannedResult(decodedText);
      handleCheckIn(decodedText);
    }
  };

  const onScanFailure = (error: any) => {
    // handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
  };

  const handleCheckIn = async (attendeeId: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await api.post(`/events/${eventId}/attendees/check-in`, {
        attendeeId,
      });
      
      const attendee = response.data;
      if (attendee.message === 'Already checked in') {
         setFeedback({
          type: 'error',
          message: `${attendee.name} is ALREADY checked in.`,
          attendee
        });
      } else {
        setFeedback({
            type: 'success',
            message: `Welcome, ${attendee.name}!`,
            attendee
        });
      }
      
      // Clear last scanned result after a delay to allow re-scanning if needed (e.g. invalid)
      setTimeout(() => setLastScannedResult(null), 3000);

    } catch (error: any) {
      console.error('Check-in error:', error);
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Check-in failed. Invalid ticket?',
      });
      setTimeout(() => setLastScannedResult(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      handleCheckIn(manualId.trim());
      setManualId('');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
             <Link href={`/events/${eventId}`} className="flex items-center text-indigo-600 hover:text-indigo-800">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Event
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white">
              <h1 className="text-xl font-bold flex items-center">
                <Camera className="mr-2 h-6 w-6" />
                Details Check-in
              </h1>
            </div>

            <div className="p-6">
              <div id="reader" className="w-full mb-6"></div>

              {/* Feedback Area */}
              {feedback && (
                <div className={`mb-6 p-4 rounded-md ${
                  feedback.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                  feedback.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  <div className="flex items-center">
                    {feedback.type === 'success' && <Check className="h-6 w-6 mr-2" />}
                    {feedback.type === 'error' && <X className="h-6 w-6 mr-2" />}
                    <span className="font-bold text-lg">{feedback.message}</span>
                  </div>
                  {feedback.attendee && (
                      <div className="mt-2 text-sm">
                          <p>Email: {feedback.attendee.email}</p>
                          {feedback.attendee.rut && <p>RUT: {feedback.attendee.rut}</p>}
                      </div>
                  )}
                </div>
              )}

              {loading && (
                  <div className="text-center py-4 text-gray-500">Processing...</div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Manual Entry</h3>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter Attendee ID"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  />
                  <button
                    type="submit"
                    disabled={loading || !manualId}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    Check In
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
