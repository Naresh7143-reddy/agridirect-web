'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Truck, Package, MapPin, Phone, User, Check, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

function ContactRow({ icon: Icon, color, label, name, phone, address }: {
  icon: any; color: string; label: string;
  name?: string; phone?: string; address?: string;
}) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-bg p-3 space-y-1`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-ink-3 uppercase tracking-wide">
        <Icon className="size-3" />{label}
      </div>
      {name && (
        <div className="flex items-center gap-2">
          <User className="size-3.5 text-ink-2 shrink-0" />
          <span className="font-bold text-sm">{name}</span>
        </div>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-2 hover:underline">
          <Phone className="size-3.5 text-ink-2 shrink-0" />
          <span className="text-sm font-semibold">{phone}</span>
        </a>
      )}
      {address && (
        <div className="flex items-start gap-2">
          <MapPin className="size-3.5 text-ink-2 shrink-0 mt-0.5" />
          <span className="text-sm text-ink-2 leading-snug">{address}</span>
        </div>
      )}
    </div>
  );
}

export default function DeliveryHome() {
  const [available, setAvailable] = useState<any[]>([]);
  const [assigned, setAssigned]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState<string | null>(null);
  const [online, setOnline]       = useState(true);

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
      toast.success(`Marked ${status.replace(/_/g, ' ').toLowerCase()}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setBusyId(null);
    }
  };

  const openMaps = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-9xl opacity-10">🚲</div>
        <p className="text-white/80">Delivery Partner</p>
        <h1 className="text-4xl font-extrabold mt-1">Today's deliveries</h1>
        <div
          className="mt-6 inline-flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 cursor-pointer"
          onClick={() => { setOnline(!online); toast.success(!online ? "You're online" : "You're offline"); }}
        >
          <div className={`size-3 rounded-full ${online ? 'bg-green-300 animate-pulse' : 'bg-white/40'}`} />
          <span className="font-bold">{online ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </motion.section>

      {/* Available pool */}
      <section>
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
          <Package className="size-5 text-blue-600" /> Available orders ({available.length})
        </h2>
        {loading ? (
          <Loader2 className="size-6 animate-spin text-primary mx-auto" />
        ) : available.length === 0 ? (
          <div className="card text-center py-10 text-ink-2">No available orders right now. Check back in a bit!</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {available.map((o) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink-3">#{String(o.id ?? o.orderId ?? '').slice(0, 8).toUpperCase()}</span>
                  <span className="font-extrabold text-primary text-lg">{formatINR(o.totalAmount)}</span>
                </div>

                {/* Item count + distance */}
                <div className="flex gap-3 text-xs text-ink-2">
                  {o.itemCount && <span className="bg-bg px-2 py-0.5 rounded-full font-semibold">{o.itemCount} items</span>}
                  {o.distance && <span className="bg-bg px-2 py-0.5 rounded-full font-semibold">{o.distance} km</span>}
                  {o.deliveryFee && <span className="bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">Earn {formatINR(o.deliveryFee)}</span>}
                </div>

                {/* Farmer (Pickup) */}
                <ContactRow
                  icon={Package}
                  color="border-orange-400"
                  label="Pickup — Farmer"
                  name={o.farmerName}
                  phone={o.farmerPhone}
                  address={o.pickupAddress}
                />

                {/* Buyer (Drop) */}
                <ContactRow
                  icon={MapPin}
                  color="border-blue-400"
                  label="Drop — Buyer"
                  name={o.buyerName}
                  phone={o.buyerPhone}
                  address={o.dropAddress}
                />

                {/* Claim button */}
                <button
                  onClick={() => claim(o.id ?? o.orderId)}
                  disabled={busyId === (o.id ?? o.orderId)}
                  className="btn-primary w-full py-3"
                >
                  {busyId === (o.id ?? o.orderId) ? <Loader2 className="size-4 animate-spin" /> : 'Claim order'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Assigned / active deliveries */}
      <section>
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
          <Truck className="size-5 text-primary" /> Your active deliveries ({assigned.length})
        </h2>
        {!loading && assigned.length === 0 ? (
          <div className="card text-center py-10 text-ink-2">Nothing assigned. Claim from the pool above.</div>
        ) : (
          <div className="space-y-4">
            {assigned.map((o) => (
              <motion.div key={o.id ?? o.orderId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-mono text-ink-3">#{String(o.id ?? o.orderId ?? '').slice(0, 8).toUpperCase()}</span>
                    <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                      o.status === 'DELIVERED' ? 'bg-success/10 text-success'
                      : o.status === 'PICKED_UP' || o.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-yellow-100 text-yellow-700'
                    }`}>{o.status?.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="font-extrabold text-primary text-lg">{formatINR(o.totalAmount)}</span>
                </div>

                {/* Item count + delivery fee */}
                <div className="flex gap-3 text-xs text-ink-2">
                  {o.itemCount && <span className="bg-bg px-2 py-0.5 rounded-full font-semibold">{o.itemCount} items</span>}
                  {o.deliveryFee && <span className="bg-success/10 text-success px-2 py-0.5 rounded-full font-semibold">Earn {formatINR(o.deliveryFee)}</span>}
                </div>

                {/* Farmer (Pickup) */}
                <ContactRow
                  icon={Package}
                  color="border-orange-400"
                  label="Pickup — Farmer"
                  name={o.farmerName}
                  phone={o.farmerPhone}
                  address={o.pickupAddress}
                />

                {/* Buyer (Drop) */}
                <ContactRow
                  icon={MapPin}
                  color="border-blue-400"
                  label="Drop — Buyer"
                  name={o.buyerName}
                  phone={o.buyerPhone}
                  address={o.dropAddress}
                />

                {/* Navigate buttons */}
                <div className="flex gap-2 flex-wrap">
                  {o.pickupAddress && (
                    <button onClick={() => openMaps(o.pickupAddress)} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition">
                      <Navigation className="size-3" /> Navigate to farm
                    </button>
                  )}
                  {o.dropAddress && (
                    <button onClick={() => openMaps(o.dropAddress)} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition">
                      <Navigation className="size-3" /> Navigate to buyer
                    </button>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {(o.status === 'ASSIGNED' || o.status === 'assigned') && (
                    <button onClick={() => updateStatus(o.id ?? o.orderId, 'PICKED_UP')} disabled={busyId === (o.id ?? o.orderId)} className="btn-primary text-sm py-2 px-4">
                      {busyId === (o.id ?? o.orderId) ? <Loader2 className="size-4 animate-spin" /> : '📦 Picked up'}
                    </button>
                  )}
                  {(o.status === 'PICKED_UP' || o.status === 'picked_up' || o.status === 'IN_TRANSIT' || o.status === 'in_transit' || o.status === 'ON_THE_WAY') && (
                    <button onClick={() => updateStatus(o.id ?? o.orderId, 'DELIVERED')} disabled={busyId === (o.id ?? o.orderId)} className="btn-primary text-sm py-2 px-4">
                      {busyId === (o.id ?? o.orderId) ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4 inline mr-1" />Mark delivered</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
