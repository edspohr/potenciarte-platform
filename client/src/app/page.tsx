'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold text-teal-400 mb-4">Welcome to Potenciarte!</h1>
        <p className="mb-4">You are logged in as <span className="font-semibold text-teal-200">{user?.email}</span></p>
        <button
          onClick={signOut}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Sign Out
        </button>
      </div>
    </ProtectedRoute>
  );
}
