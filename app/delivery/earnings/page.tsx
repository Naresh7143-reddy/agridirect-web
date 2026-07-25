'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, IndianRupee, TrendingUp, Package, Calendar, Bike, RefreshCw } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function DeliveryEarnings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getEarnings();
      setData(res.data ?? res);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  const earnings = data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Earnings</h1>
          <p className="text-ink-2 mt-1">Track your delivery earnings</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {/* Hero earnings card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-9xl opacity-10">💰</div>
        <p className="text-white/80 text-sm">Total Earnings</p>
        <div className="text-5xl font-extrabold mt-2">{formatINR(earnings.totalEarnings ?? 0)}</div>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <div className="text-white/60">Deliveries</div>
            <div className="text-xl font-bold">{earnings.totalDeliveries ?? 0}</div>
          </div>
          <div>
            <div className="text-white/60">Avg per delivery</div>
            <div className="text-xl font-bold">{formatINR(earnings.avgPerDelivery ?? 0)}</div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} bg="bg-success/10" color="text-success" label="Today" value={formatINR(earnings.todayEarnings ?? 0)} delay={0} />
        <StatCard icon={Calendar} bg="bg-blue-100" color="text-blue-600" label="This Week" value={formatINR(earnings.weekEarnings ?? 0)} delay={0.05} />
        <StatCard icon={TrendingUp} bg="bg-purple-100" color="text-purple-600" label="This Month" value={formatINR(earnings.monthEarnings ?? 0)} delay={0.1} />
        <StatCard icon={Package} bg="bg-primary/10" color="text-primary" label="Pending Payout" value={formatINR(earnings.pendingPayout ?? 0)} delay={0.15} />
      </div>

      {/* Deliveries breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg">Deliveries Summary</h2>
          <div className="space-y-3">
            <BarRow label="Completed" value={earnings.completedDeliveries ?? 0} max={earnings.totalDeliveries || 1} color="bg-success" />
            <BarRow label="In Progress" value={earnings.activeDeliveries ?? 0} max={earnings.totalDeliveries || 1} color="bg-blue-500" />
            <BarRow label="Cancelled" value={earnings.cancelledDeliveries ?? 0} max={earnings.totalDeliveries || 1} color="bg-error" />
          </div>
        </div>
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg">Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-ink-2 text-sm">Average rating</span>
              <span className="font-bold text-lg flex items-center gap-1">⭐ {(earnings.avgRating ?? 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-2 text-sm">Delivery acceptance</span>
              <span className="font-bold text-lg">{earnings.acceptanceRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-2 text-sm">On-time delivery</span>
              <span className="font-bold text-lg">{earnings.onTimeRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-2 text-sm">Total km covered</span>
              <span className="font-bold text-lg flex items-center gap-1"><Bike className="size-4 text-primary" /> {earnings.totalKm ?? 0} km</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, bg, color, label, value, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card">
      <div className={`size-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-ink-2 mt-1">{label}</div>
    </motion.div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-bg rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-2 rounded-full ${color}`}
        />
      </div>
      <span className="text-sm font-bold w-8 text-right">{value}</span>
    </div>
  );
}
