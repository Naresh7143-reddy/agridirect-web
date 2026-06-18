'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, ChevronDown, Loader2, RefreshCw, IndianRupee } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'PACKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

const STATUS_COLOR: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  ACCEPTED:   'bg-blue-100 text-blue-700',
  PACKED:     'bg-purple-100 text-purple-700',
  PICKED_UP:  'bg-orange-100 text-orange-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  ON_THE_WAY: 'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

const ALL_STATUSES: StatusFilter[] = ['ALL','PENDING','ACCEPTED','PACKED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState<StatusFilter>('ALL');
  const [actionId, setActionId]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/admin/orders');
      setOrders(res.data?.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setActionId(orderId);
    try {
      await client.put(`/api/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {}
    finally { setActionId(null); }
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = query.toLowerCase();
    const matchQ = !q || o.id?.toLowerCase().includes(q) || o.buyerName?.toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const revenue = orders.filter(o => o.status === 'DELIVERED').reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Orders</h1>
          <p className="text-ink-2 mt-1">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-success/10 text-success font-bold rounded-xl px-4 py-2">
            <IndianRupee className="size-4" />{formatINR(revenue)} revenue
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${statusFilter === s ? 'bg-primary text-white' : 'bg-bg text-ink-2 hover:bg-border'}`}
          >
            {s === 'ALL' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by order ID or buyer…" className="input pl-9 w-full" />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-2 text-left">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-ink-2">No orders found</td></tr>
              ) : filtered.map((order, i) => (
                <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-mono text-xs text-ink-2">#{order.id?.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 font-semibold">{order.buyerName || order.buyerId?.slice(0,8) || '—'}</td>
                  <td className="px-4 py-3 font-bold text-primary">{formatINR(order.totalAmount ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-bg text-ink-2'}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-success/10 text-success' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus ?? 'PENDING'}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        disabled={actionId === order.id}
                        className="text-xs border border-border rounded-lg px-2 py-1 pr-6 bg-white appearance-none"
                      >
                        {['PENDING','ACCEPTED','PACKED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {actionId === order.id ? <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 size-3 animate-spin" /> : <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 size-3 text-ink-3 pointer-events-none" />}
                    </div>
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
