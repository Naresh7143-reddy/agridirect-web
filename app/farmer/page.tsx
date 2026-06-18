'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Package, ShoppingBag, Star, Plus, Sparkles, IndianRupee } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function FarmerHome() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [farmerName, setFarmerName] = useState<string>('');

  useEffect(() => {
    client.get('/api/auth/me')
      .then((r) => setFarmerName(r.data?.data?.name ?? ''))
      .catch(() => {});
    client.get('/api/farmer/dashboard')
      .then((r) => setStats(r.data?.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-9xl opacity-10">🌾</div>
        <p className="text-white/80">{greeting},</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mt-1">{farmerName || 'Farmer'} 🌾</h1>
        <p className="mt-4 text-white/90">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} color="text-success" bg="bg-success/10" label="Total revenue" value={formatINR(stats.totalRevenue ?? 0)} loading={loading} />
        <StatCard icon={ShoppingBag} color="text-primary" bg="bg-primary/10" label="Total orders" value={String(stats.totalOrders ?? 0)} loading={loading} />
        <StatCard icon={Package} color="text-primary" bg="bg-primary/10" label="Active products" value={String(stats.activeProducts ?? 0)} loading={loading} />
        <StatCard icon={Star} color="text-secondary" bg="bg-secondary/10" label="Rating" value={(stats.averageRating ?? 0).toFixed(1)} loading={loading} />
      </div>

      {/* Orders breakdown */}
      {!loading && (stats.totalOrders ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <div className="text-2xl font-extrabold text-yellow-600">{stats.pendingOrders ?? 0}</div>
            <div className="text-xs text-ink-2 mt-1">Pending</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-extrabold text-blue-600">{stats.acceptedOrders ?? 0}</div>
            <div className="text-xs text-ink-2 mt-1">Accepted</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-extrabold text-success">{stats.deliveredOrders ?? 0}</div>
            <div className="text-xs text-ink-2 mt-1">Delivered</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-xl font-extrabold mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionCard href="/farmer/products" icon={Plus} label="Add product" desc="List new produce" />
          <ActionCard href="/farmer/orders" icon={ShoppingBag} label="Orders" desc={`${stats.pendingOrders ?? 0} pending`} />
          <ActionCard href="/farmer/ai" icon={Sparkles} label="Krishi AI" desc="Ask anything" />
          <ActionCard href="/farmer/profile" icon={TrendingUp} label="Earnings" desc="Track payouts" />
        </div>
      </section>

      {/* Pending banner */}
      {(stats.pendingOrders ?? 0) > 0 && (
        <Link href="/farmer/orders" className="block rounded-2xl bg-warning/10 border border-warning/30 p-5 hover:shadow-card transition">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔔</div>
            <div className="flex-1">
              <div className="font-bold text-ink-1">{stats.pendingOrders} new order{stats.pendingOrders === 1 ? '' : 's'} waiting</div>
              <div className="text-sm text-ink-2">Tap to review and accept →</div>
            </div>
          </div>
        </Link>
      )}

      {/* Tip card */}
      <section className="rounded-3xl bg-gradient-to-r from-green-50 to-yellow-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl">💡</div>
          <div>
            <h3 className="font-bold text-lg">Today's farming tip</h3>
            <p className="text-ink-2 mt-1 leading-relaxed">
              Check the weather forecast before irrigating — it can save you 30% on water costs.
              Ask Krishi AI for region-specific advice.
            </p>
            <Link href="/farmer/ai" className="mt-3 inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline">
              Open Krishi AI <Sparkles className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, color, bg, label, value, loading }: any) {
  return (
    <div className="card">
      <div className={`size-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`size-5 ${color}`} /></div>
      <div className="text-2xl font-extrabold">{loading ? '…' : value}</div>
      <div className="text-xs text-ink-2 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, label, desc }: any) {
  return (
    <Link href={href} className="card group hover:-translate-y-1">
      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition"><Icon className="size-5 text-primary group-hover:text-white" /></div>
      <div className="font-bold">{label}</div>
      <div className="text-xs text-ink-2 mt-1">{desc}</div>
    </Link>
  );
}
