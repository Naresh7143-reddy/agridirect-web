'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ShieldCheck, ShieldOff, Phone, UserCheck, UserX, Loader2, ChevronDown } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

type Role = 'ALL' | 'FARMER' | 'BUYER' | 'DELIVERY' | 'ADMIN';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLOR: Record<string, string> = {
  FARMER:   'bg-success/10 text-success',
  BUYER:    'bg-primary/10 text-primary',
  DELIVERY: 'bg-secondary/10 text-secondary',
  ADMIN:    'bg-error/10 text-error',
};

export default function AdminUsers() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [roleFilter, setRole]   = useState<Role>('ALL');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/admin/users');
      setUsers(res.data?.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (user: User) => {
    setActionId(user.id);
    try {
      const url = user.isActive
        ? `/api/admin/users/${user.id}/block`
        : `/api/admin/users/${user.id}/unblock`;
      await client.put(url);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch {}
    finally { setActionId(null); }
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = query.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.role?.toLowerCase().includes(q);
    return matchRole && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">User Management</h1>
          <p className="text-ink-2 mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-2 bg-success/10 text-success font-bold rounded-xl px-4 py-2">
          <Users className="size-4" />
          {users.filter(u => u.isActive).length} active
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or phone…"
            className="input pl-9 w-full"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={e => setRole(e.target.value as Role)}
            className="input pr-8 appearance-none"
          >
            <option value="ALL">All roles</option>
            <option value="FARMER">Farmers</option>
            <option value="BUYER">Buyers</option>
            <option value="DELIVERY">Delivery</option>
            <option value="ADMIN">Admin</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-3 pointer-events-none" />
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['FARMER','BUYER','DELIVERY','ADMIN'] as const).map(role => (
          <button
            key={role}
            onClick={() => setRole(prev => prev === role ? 'ALL' : role)}
            className={`card text-left transition hover:shadow-md ${roleFilter === role ? 'ring-2 ring-primary' : ''}`}
          >
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 ${ROLE_COLOR[role]}`}>{role}</div>
            <div className="text-2xl font-extrabold">{users.filter(u => u.role === role).length}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-2 text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-ink-2">No users found</td></tr>
              ) : filtered.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-bg"
                >
                  <td className="px-4 py-3 font-semibold">{user.name || '—'}</td>
                  <td className="px-4 py-3 text-ink-2 flex items-center gap-1">
                    <Phone className="size-3" />{user.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role] ?? 'bg-bg text-ink-2'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {user.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(user)}
                      disabled={actionId === user.id}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        user.isActive
                          ? 'bg-error/10 text-error hover:bg-error/20'
                          : 'bg-success/10 text-success hover:bg-success/20'
                      }`}
                    >
                      {actionId === user.id ? <Loader2 className="size-3 animate-spin" /> : user.isActive ? <><UserX className="size-3"/>Block</> : <><UserCheck className="size-3"/>Unblock</>}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
