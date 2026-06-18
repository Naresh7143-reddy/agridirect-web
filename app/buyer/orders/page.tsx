'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Loader2, ArrowRight, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { buyerApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { orderETA } from '@/lib/delivery';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PENDING:   { color: 'text-warning', bg: 'bg-warning/10', icon: Clock,         label: 'Order placed' },
  ACCEPTED:  { color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2,  label: 'Farmer accepted' },
  PACKED:    { color: 'text-primary', bg: 'bg-primary/10', icon: Package,       label: 'Packed' },
  ASSIGNED:  { color: 'text-primary', bg: 'bg-primary/10', icon: Truck,         label: 'Out for delivery' },
  PICKED_UP: { color: 'text-primary', bg: 'bg-primary/10', icon: Truck,         label: 'Picked up' },
  ON_THE_WAY:{ color: 'text-primary', bg: 'bg-primary/10', icon: Truck,         label: 'On the way' },
  DELIVERED: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2,  label: 'Delivered' },
  CANCELLED: { color: 'text-error',   bg: 'bg-error/10',   icon: XCircle,       label: 'Cancelled' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buyerApi.getOrders()
      .then((r) => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="size-20 text-ink-3 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold mb-2">No orders yet</h1>
        <p className="text-ink-2 mb-8">Your future orders will appear here.</p>
        <Link href="/buyer/browse" className="btn-primary">Start shopping <ArrowRight className="size-5" /></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8">Your orders</h1>
      <div className="space-y-4">
        {orders.map((o, i) => {
          const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING;
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs text-ink-3 font-mono">#{String(o.id).slice(0, 8).toUpperCase()}</div>
                  <div className={`mt-1 inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.color} rounded-full px-3 py-1 text-sm font-semibold`}>
                    <cfg.icon className="size-4" />
                    {cfg.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-3">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xl font-extrabold text-primary mt-1">{formatINR(o.totalAmount)}</div>
                </div>
              </div>
              <div className="text-sm text-ink-2 truncate">
                {(o.items ?? []).map((it: any) => it.productName ?? it.name).filter(Boolean).join(', ') || 'Order items'}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-ink-3">Pay: <span className="text-ink-1 font-semibold">{o.paymentMethod ?? 'COD'}</span></span>
                {o.status === 'PENDING' && (
                  <span className="text-xs text-ink-3">Can cancel until farmer accepts</span>
                )}
              </div>
              {(() => {
                const eta = orderETA(o.status, o.createdAt);
                return eta ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <Truck className="size-3.5" /> Estimated delivery: {eta}
                  </div>
                ) : null;
              })()}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
