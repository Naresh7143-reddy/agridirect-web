'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  IndianRupee,
  TrendingUp,
  Package,
  Calendar,
  Bike,
  RefreshCw,
  Award,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Clock,
  Coins,
  Receipt,
  Star,
} from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';

type Timeframe = 'today' | 'week' | 'month' | 'all';

export default function DeliveryEarnings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');

  const load = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getEarnings();
      setData(res.data ?? res);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="size-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  const earnings = data ?? {};

  const displayedEarnings =
    timeframe === 'today'
      ? earnings.todayEarnings ?? 0
      : timeframe === 'week'
      ? earnings.weekEarnings ?? 0
      : timeframe === 'month'
      ? earnings.monthEarnings ?? 0
      : earnings.totalEarnings ?? 0;

  const recentPayouts = earnings.recentPayouts ?? [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="size-4 text-yellow-500" /> Driver Payouts & Stats
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Earnings Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your daily income, tips, surge bonuses, and performance metrics.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 transition shadow-sm"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Hero Earnings Banner with Glassmorphic Styling */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 size-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Timeframe Selector Pills */}
          <div className="inline-flex bg-white/15 p-1 rounded-2xl border border-white/20 backdrop-blur-md">
            {(['today', 'week', 'month', 'all'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  timeframe === tf ? 'bg-white text-emerald-700 shadow-md' : 'text-white/80 hover:text-white'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'Today'}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-emerald-100/90 text-sm font-medium">Payout for {timeframe}</span>
              <div className="text-5xl font-black tracking-tight mt-1">{formatINR(displayedEarnings)}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <div>
                <div className="text-xs text-white/70">Total Deliveries</div>
                <div className="text-lg font-bold mt-0.5">{earnings.totalDeliveries ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-white/70">Avg Per Order</div>
                <div className="text-lg font-bold mt-0.5">{formatINR(earnings.avgPerDelivery ?? 0)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xs text-white/70">Pending Payout</div>
                <div className="text-lg font-bold text-yellow-300 mt-0.5">{formatINR(earnings.pendingPayout ?? 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Pay Breakdown Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Coins className="size-5 text-emerald-500" /> Itemized Pay Breakdown
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BreakdownCard
            title="Base Delivery Pay"
            amount={formatINR(earnings.basePay ?? Math.round(displayedEarnings * 0.6))}
            icon={Package}
            color="emerald"
            pct="60%"
          />
          <BreakdownCard
            title="Distance Earnings"
            amount={formatINR(earnings.distancePay ?? Math.round(displayedEarnings * 0.22))}
            icon={Bike}
            color="blue"
            pct="22%"
          />
          <BreakdownCard
            title="Peak Surge Bonus"
            amount={formatINR(earnings.surgeBonus ?? Math.round(displayedEarnings * 0.12))}
            icon={Zap}
            color="amber"
            pct="12%"
          />
          <BreakdownCard
            title="Customer Tips"
            amount={formatINR(earnings.tips ?? Math.round(displayedEarnings * 0.06))}
            icon={Award}
            color="purple"
            pct="6%"
          />
        </div>
      </section>

      {/* Performance Metrics & Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Gauges Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 space-y-5">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="size-5 text-amber-500" /> Performance & Rating
          </h2>

          <div className="space-y-4">
            <MetricRow label="Customer Rating" value={`${(earnings.avgRating ?? 0.0).toFixed(1)} ⭐`} badge="Excellent" color="text-amber-500" />
            <MetricRow label="Order Acceptance Rate" value={`${earnings.acceptanceRate ?? 0}%`} badge="Top Partner" color="text-emerald-500" />
            <MetricRow label="On-Time Delivery Rate" value={`${earnings.onTimeRate ?? 0}%`} badge="Super Fast" color="text-blue-500" />
            <MetricRow label="Total Distance Covered" value={`${earnings.totalKm ?? 0} km`} badge="High Mobility" color="text-indigo-500" />
          </div>
        </div>

        {/* Deliveries Breakdown */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 space-y-5">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="size-5 text-indigo-500" /> Delivery Status Breakdown
          </h2>

          <div className="space-y-4 pt-2">
            <BarRow label="Completed" value={earnings.completedDeliveries ?? 0} max={15} color="bg-emerald-500" />
            <BarRow label="In Progress" value={earnings.activeDeliveries ?? 0} max={15} color="bg-blue-500" />
            <BarRow label="Cancelled" value={earnings.cancelledDeliveries ?? 0} max={15} color="bg-red-400" />
          </div>
        </div>
      </div>

      {/* Recent Payout Logs Table */}
      <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock className="size-5 text-teal-600" /> Recent Completed Payouts
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">Distance</th>
                <th className="pb-3">Tip</th>
                <th className="pb-3">Payout</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-200">
              {recentPayouts.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-500/5 transition">
                  <td className="py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{p.orderId}</td>
                  <td className="py-3.5 text-slate-500">{p.date}</td>
                  <td className="py-3.5">📍 {p.distanceKm} km</td>
                  <td className="py-3.5 text-purple-600 font-bold">+{formatINR(p.customerTip || 0)}</td>
                  <td className="py-3.5 font-black text-sm text-slate-900 dark:text-slate-100">{formatINR(p.amount)}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-emerald-500/20">
                      <CheckCircle2 className="size-3" /> {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BreakdownCard({ title, amount, icon: Icon, color, pct }: any) {
  const colorMap: any = {
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className={`size-10 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="size-5" />
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {pct}
        </span>
      </div>
      <div>
        <span className="text-xs text-slate-400 font-medium block">{title}</span>
        <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{amount}</div>
      </div>
    </motion.div>
  );
}

function MetricRow({ label, value, badge, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
      <span className="text-xs text-slate-500 font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-base font-black ${color}`}>{value}</span>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {badge}
        </span>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>{value} orders</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

