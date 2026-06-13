'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, Wheat, IndianRupee, Loader2 } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/api/admin/analytics')
      .then((r) => setStats(r.data?.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Dashboard</h1>
        <p className="text-ink-2 mt-1">Welcome back, Admin 👋</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users}        bg="bg-primary/10"    color="text-primary"   label="Total users"     value={stats.totalUsers ?? 0} loading={loading} />
        <Kpi icon={Wheat}        bg="bg-success/10"    color="text-success"   label="Active farmers"  value={stats.activeFarmers ?? 0} loading={loading} />
        <Kpi icon={ShoppingBag}  bg="bg-secondary/10"  color="text-secondary" label="Orders today"    value={stats.ordersToday ?? 0} loading={loading} />
        <Kpi icon={IndianRupee}  bg="bg-success/10"    color="text-success"   label="Revenue this month" value={formatINR(stats.monthRevenue ?? 0)} loading={loading} />
      </div>

      {/* Quick links */}
      <section>
        <h2 className="text-xl font-extrabold mb-4">Recent activity</h2>
        <div className="card text-center py-12 text-ink-2">
          {loading ? <Loader2 className="size-6 animate-spin text-primary mx-auto" /> : 'Detailed analytics coming soon — backend endpoints ready ✅'}
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, bg, color, label, value, loading }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
      <div className={`size-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`size-6 ${color}`} />
      </div>
      <div className="text-3xl font-extrabold">{loading ? '…' : value}</div>
      <div className="text-sm text-ink-2 mt-1">{label}</div>
    </motion.div>
  );
}
