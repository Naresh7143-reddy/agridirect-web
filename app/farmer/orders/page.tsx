'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, Package as PackageIcon } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'bg-warning/10 text-warning',
  ACCEPTED:  'bg-primary/10 text-primary',
  PACKED:    'bg-primary/10 text-primary',
  ASSIGNED:  'bg-primary/10 text-primary',
  DELIVERED: 'bg-success/10 text-success',
  CANCELLED: 'bg-error/10 text-error',
};

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    client.get('/api/farmer/orders')
      .then((r) => setOrders(r.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const transition = async (id: string, action: 'accept' | 'packed') => {
    setBusyId(id);
    try {
      await client.put(`/api/farmer/orders/${id}/${action}`);
      toast.success(action === 'accept' ? 'Order accepted' : 'Marked as packed');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 card">
        <PackageIcon className="size-16 text-ink-3 mx-auto mb-4" />
        <h2 className="font-bold text-xl">No orders yet</h2>
        <p className="text-ink-2 mt-2">Once buyers order your produce, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-ink-3">#{String(o.id).slice(0, 8).toUpperCase()}</div>
                <div className={`mt-1 inline-block ${STATUS_COLOR[o.status] || 'bg-ink-3/10'} rounded-full px-3 py-1 text-sm font-bold`}>
                  {o.status}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-3">{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                <div className="text-xl font-extrabold text-primary mt-1">{formatINR(o.totalAmount)}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {o.status === 'PENDING' && (
                <button onClick={() => transition(o.id, 'accept')} disabled={busyId === o.id} className="btn-primary text-sm py-2 px-4">
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Accept</>}
                </button>
              )}
              {o.status === 'ACCEPTED' && (
                <button onClick={() => transition(o.id, 'packed')} disabled={busyId === o.id} className="btn-primary text-sm py-2 px-4">
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <><PackageIcon className="size-4" /> Mark packed</>}
                </button>
              )}
              {o.status === 'PACKED' && (
                <span className="text-sm text-ink-2">Waiting for delivery agent to claim…</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
