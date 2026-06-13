'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Truck, Package, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function DeliveryHome() {
  const [available, setAvailable] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      client.get('/api/delivery/orders').catch(() => ({ data: { data: [] } } as any)),
      client.get('/api/delivery/orders/available').catch(() => ({ data: { data: [] } } as any)),
    ])
      .then(([a, p]) => {
        setAssigned((a as any).data?.data ?? []);
        setAvailable((p as any).data?.data ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const claim = async (id: string) => {
    setBusyId(id);
    try {
      await client.post(`/api/delivery/orders/${id}/claim`);
      toast.success('Order claimed!');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not claim');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await client.put(`/api/delivery/orders/${id}/status`, { status });
      toast.success(`Marked ${status.replace('_', ' ').toLowerCase()}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-9xl opacity-10">🚲</div>
        <p className="text-white/80">Delivery Partner</p>
        <h1 className="text-4xl font-extrabold mt-1">Today's deliveries</h1>
        <div className="mt-6 inline-flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 cursor-pointer" onClick={() => { setOnline(!online); toast.success(!online ? "You're online" : "You're offline"); }}>
          <div className={`size-3 rounded-full ${online ? 'bg-success animate-pulse' : 'bg-ink-3'}`} />
          <span className="font-bold">{online ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </motion.section>

      {/* Available pool */}
      <section>
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
          <Package className="size-5 text-blue-600" /> Available orders ({available.length})
        </h2>
        {loading ? <Loader2 className="size-6 animate-spin text-primary mx-auto" /> : available.length === 0 ? (
          <div className="card text-center py-10 text-ink-2">No available orders right now. Check back in a bit!</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {available.map((o) => (
              <div key={o.id} className="card">
                <div className="text-xs font-mono text-ink-3">#{String(o.id).slice(0, 8).toUpperCase()}</div>
                <div className="text-xl font-extrabold text-primary mt-2">{formatINR(o.totalAmount)}</div>
                <div className="mt-2 text-sm text-ink-2 flex items-center gap-1"><MapPin className="size-3" /> {o.deliveryAddress ? String(o.deliveryAddress).slice(0, 50) : 'Address on claim'}</div>
                <button onClick={() => claim(o.id)} disabled={busyId === o.id} className="btn-primary w-full mt-4 py-3">
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <>Claim order</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assigned */}
      <section>
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
          <Truck className="size-5 text-primary" /> Your active deliveries ({assigned.length})
        </h2>
        {loading ? null : assigned.length === 0 ? (
          <div className="card text-center py-10 text-ink-2">Nothing assigned. Claim from the pool above.</div>
        ) : (
          <div className="space-y-3">
            {assigned.map((o) => (
              <div key={o.id} className="card">
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs font-mono text-ink-3">#{String(o.id).slice(0, 8).toUpperCase()}</div>
                    <div className="font-bold mt-1">{o.status}</div>
                  </div>
                  <div className="text-xl font-extrabold text-primary">{formatINR(o.totalAmount)}</div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {o.status === 'ASSIGNED' && (
                    <button onClick={() => updateStatus(o.id, 'PICKED_UP')} disabled={busyId === o.id} className="btn-primary text-sm py-2 px-3">Picked up</button>
                  )}
                  {(o.status === 'PICKED_UP' || o.status === 'ON_THE_WAY') && (
                    <button onClick={() => updateStatus(o.id, 'DELIVERED')} disabled={busyId === o.id} className="btn-primary text-sm py-2 px-3"><Check className="size-4" /> Mark delivered</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
