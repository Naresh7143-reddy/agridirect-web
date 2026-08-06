'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, Check, Package as PackageIcon, Phone, MapPin, User,
  Truck, Clock, CheckCircle2, Navigation, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { motion } from 'framer-motion';

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:    { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200' },
  ACCEPTED:   { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200' },
  PACKED:     { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200' },
  ASSIGNED:   { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200' },
  REACHED_FARM:{ bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200' },
  PICKED_UP:  { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200' },
  IN_TRANSIT: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200' },
  ON_THE_WAY: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200' },
  DELIVERED:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200' },
  CANCELLED:  { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200' },
};

const STEPS = [
  { key: 'PENDING', label: 'Placed' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'ASSIGNED', label: 'Partner Assigned' },
  { key: 'PICKED_UP', label: 'Picked Up' },
  { key: 'DELIVERED', label: 'Delivered' },
];

function getStepIndex(status: string) {
  const norm = status?.toUpperCase() ?? '';
  if (norm === 'DELIVERED') return 5;
  if (['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(norm)) return 4;
  if (['ASSIGNED', 'REACHED_FARM'].includes(norm)) return 3;
  if (norm === 'PACKED') return 2;
  if (norm === 'ACCEPTED') return 1;
  if (norm === 'CANCELLED') return -1;
  return 0;
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    client.get('/api/farmer/orders')
      .then((r) => setOrders(r.data?.data ?? r.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const transition = async (id: string, action: 'accept' | 'packed') => {
    setBusyId(id);
    try {
      await client.put(`/api/farmer/orders/${id}/${action}`);
      toast.success(action === 'accept' ? '🎉 Order accepted successfully!' : '📦 Marked as packed & ready for pickup');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update order');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="size-10 animate-spin text-emerald-600" />
      <span className="text-sm font-semibold text-slate-500">Loading incoming orders...</span>
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 card max-w-2xl mx-auto rounded-3xl p-10 border border-slate-200">
        <PackageIcon className="size-16 text-slate-400 mx-auto mb-4 opacity-50" />
        <h2 className="font-extrabold text-2xl text-slate-800">No orders yet</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
          Once buyers place orders for your farm produce, they will appear here with full buyer and delivery details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Farm Orders Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage buyer orders, prepare packages, and track delivery partners in real-time.</p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 transition text-slate-600 flex items-center gap-2 text-xs font-bold"
          title="Refresh"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      <div className="space-y-6">
        {orders.map((o, index) => {
          const cfg = STATUS_COLOR[o.status] || STATUS_COLOR.PENDING;
          const currentStep = getStepIndex(o.status);
          const isCancelled = o.status === 'CANCELLED';

          // Format delivery address display
          const rawAddress = o.deliveryAddress;
          const addressStr = typeof rawAddress === 'object' && rawAddress !== null
            ? [rawAddress.line1 || rawAddress.label, rawAddress.city, rawAddress.state, rawAddress.pincode ? `PIN: ${rawAddress.pincode}` : '']
                .filter(Boolean).join(', ')
            : String(rawAddress || 'Buyer Address');

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
            >
              {/* Header Bar */}
              <div className="p-6 pb-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="font-mono font-bold text-sm bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-slate-800">
                    #{String(o.id).slice(0, 8).toUpperCase()}
                  </div>
                  <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {o.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Order Total</span>
                    <span className="text-xl font-black text-emerald-600">{formatINR(o.totalAmount)}</span>
                  </div>
                  <div className="text-right text-xs text-slate-400 font-medium">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>

              {/* Status Timeline Bar */}
              {!isCancelled && (
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                  <div className="grid grid-cols-6 gap-1 relative">
                    {STEPS.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-1">
                          <div
                            className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-200 text-slate-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
                          >
                            {isDone ? <Check className="size-3.5" /> : idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Card Body: Details Grid */}
              <div className="p-6 grid md:grid-cols-3 gap-6">
                {/* Column 1: Buyer Details */}
                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <User className="size-4 text-emerald-600" /> Buyer Details
                    </span>
                    {o.buyerPhone && (
                      <a
                        href={`tel:${o.buyerPhone}`}
                        className="size-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0"
                        title="Call Buyer"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
                  </div>

                  <div>
                    <div className="font-extrabold text-base text-slate-900">{o.buyerName || 'Buyer'}</div>
                    {o.buyerPhone ? (
                      <a href={`tel:${o.buyerPhone}`} className="text-xs text-slate-600 font-semibold hover:underline flex items-center gap-1 mt-0.5">
                        <Phone className="size-3 text-emerald-600" /> {o.buyerPhone}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Phone available after accept</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
                      <MapPin className="size-3 text-emerald-600" /> Delivery Address
                    </div>
                    <p className="text-xs text-slate-600 leading-snug font-medium">{addressStr}</p>
                  </div>
                </div>

                {/* Column 2: Items Ordered */}
                <div className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <PackageIcon className="size-4 text-slate-500" /> Items Ordered ({o.items?.length || 1})
                  </span>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(o.items ?? []).length > 0 ? (
                      (o.items ?? []).map((it: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥦</span>
                            <div>
                              <span className="font-bold text-slate-800">{it.productName || it.name || 'Item'}</span>
                              <span className="text-slate-500 block text-[11px]">
                                {it.quantity} {it.unit || 'kg'} × {formatINR(it.priceAtOrder || it.pricePerUnit || it.price || 0)}
                              </span>
                            </div>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            {formatINR((it.priceAtOrder || it.pricePerUnit || it.price || 0) * (it.quantity || 1))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">Order items list</div>
                    )}
                  </div>
                </div>

                {/* Column 3: Delivery Partner Info */}
                <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <Truck className="size-4 text-indigo-600" /> Delivery Partner
                    </span>
                    {o.agentPhone && (
                      <a
                        href={`tel:${o.agentPhone}`}
                        className="size-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0"
                        title="Call Delivery Partner"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
                  </div>

                  {o.agentName ? (
                    <div className="space-y-1">
                      <div className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <span>🚲</span> {o.agentName}
                      </div>
                      {o.agentPhone && (
                        <a href={`tel:${o.agentPhone}`} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                          <Phone className="size-3" /> {o.agentPhone}
                        </a>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        Vehicle: <strong className="text-slate-700">{o.agentVehicleType || 'BIKE'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-slate-500 flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-indigo-100">
                      <AlertCircle className="size-4 text-amber-500 shrink-0" />
                      <span>{o.status === 'PENDING' ? 'Accept order to trigger partner assignment' : 'Waiting for nearby delivery partner to claim order...'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <Navigation className="size-3.5 text-emerald-600" />
                  <span>Farm Location: <strong>{o.farmName || o.farmLocation || 'Your Farm'}</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  {o.status === 'PENDING' && (
                    <button
                      onClick={() => transition(o.id, 'accept')}
                      disabled={busyId === o.id}
                      className="btn-primary text-sm py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition flex items-center gap-2"
                    >
                      {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Accept Order</>}
                    </button>
                  )}

                  {o.status === 'ACCEPTED' && (
                    <button
                      onClick={() => transition(o.id, 'packed')}
                      disabled={busyId === o.id}
                      className="btn-primary text-sm py-2.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition flex items-center gap-2"
                    >
                      {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : <><PackageIcon className="size-4" /> Mark Packed & Ready</>}
                    </button>
                  )}

                  {o.status === 'PACKED' && (
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200">
                      📦 Packed — Ready for Partner Pickup
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

