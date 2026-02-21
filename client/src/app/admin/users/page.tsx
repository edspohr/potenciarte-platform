'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api'; // Correct import path for api instance
import { toast } from 'sonner';
import {
  User as UserIcon,
  Ban,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface User {
  id: string;
  email: string; // Corrected field name from 'fullName' to 'email' based on API response
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  isBlocked?: boolean;
}

export default function AdminUsersPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || role !== 'ADMIN') {
        toast.error('Unauthorized access');
        router.push('/dashboard');
        return;
      }
      fetchUsers();
    }
  }, [user, role, authLoading, router]); // Corrected dependency array

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as User['role'] } : u))
      );
      toast.success('User role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus?: boolean) => {
    const newStatus = !currentStatus;
    try {
      await api.patch(`/users/${userId}/block`, { isBlocked: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: newStatus } : u))
      );
      toast.success(newStatus ? 'User blocked' : 'User unblocked');
    } catch (error) {
      console.error('Error toggling block status:', error);
      toast.error('Failed to update block status');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400">Manage user roles and access</p>
          </div>
          <div className="rounded-lg bg-gray-900 p-2 text-sm text-gray-400 border border-gray-800">
            Total Users: <span className="text-white font-medium">{users.length}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-gray-400">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400">
                         <UserIcon size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{u.fullName || 'Unknown Name'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-md border border-gray-700 bg-gray-950 px-3 py-1.5 text-xs text-gray-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                      <option value="USER">User</option>
                    </select>
                  </td>
                  <td className="p-4">
                     <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isBlocked
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {u.isBlocked ? (
                        <>
                          <Ban size={12} />
                          Blocked
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                        onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                        className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors ${
                            u.isBlocked
                            ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                        }`}
                        >
                        {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
             <div className="p-12 text-center text-gray-500">
                No users found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
