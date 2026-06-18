'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, ShoppingBag, Wheat, Bike, IndianRupee, Loader2, RefreshCw } from 'lucide-react';
import client from '@/lib/api';
import { formatINR } from '@/lib/utils';

const CARD_DELAY = 0.06;

function KpiCard({ icon: Icon, bg, color, label, value, sub, loading, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card">
      <div className={`size-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`size-6 ${color}`} />
      </div>
      {loading ? <div className="h-8 w-24 bg-bg rounded animate-pulse mb-1" /> : <div className="text-3xl font-extrabold">{value}</div>}
      <div className="text-sm text-ink-2 mt-1">{label}</div>
      {sub && <div className="text-xs text-ink-3 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-bg rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-2 rounded-full ${color}`}
        />
      </div>
      <span className="text-sm font-bold w-10 text-right">{value}</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData]     = useState<any>({});
  const [loading, setLoad]  = useState(true);
  const [reports, setRep]   = useState<any>({});

  const load = async () => {
    setLoad(true);
    try {
      const [analytics, ordersRep, usersRep] = await Promise.all([
        client.get('/api/admin/analytics').then(r => r.data?.data ?? {}),
        client.get('/api/admin/reports/orders').then(r => r.data?.data ?? {}).catch(() => ({})),
        client.get('/api/admin/reports/users').then(r => r.data?.data ?? {}).catch(() => ({})),
      ]);
      setData(analytics);
      setRep({ orders: ordersRep, users: usersRep });
    } catch {}
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, []);

  const ordersByStatus = data.ordersByStatus ?? {};
  const maxOrders = Math.max(...Object.values(ordersByStatus).map(Number), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Analytics</h1>
          <p className="text-ink-2 mt-1">Platform-wide performance metrics</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard delay={0}               icon={Users}        bg="bg-primary/10"   color="text-primary"   label="Total Users"       value={data.totalUsers ?? 0}       loading={loading} />
        <KpiCard delay={CARD_DELAY}      icon={Wheat}        bg="bg-success/10"   color="text-success"   label="Active Farmers"    value={data.activeFarmers ?? 0}    loading={loading} />
        <KpiCard delay={CARD_DELAY * 2}  icon={ShoppingBag}  bg="bg-yellow-100"   color="text-yellow-600" label="Total Orders"     value={data.totalOrders ?? 0}      loading={loading} />
        <KpiCard delay={CARD_DELAY * 3}  icon={IndianRupee}  bg="bg-success/10"   color="text-success"   label="Total Revenue"     value={formatINR(data.totalRevenue ?? 0)} loading={loading} />
        <KpiCard delay={CARD_DELAY * 4}  icon={ShoppingBag}  bg="bg-indigo-100"   color="text-indigo-600" label="Orders Today"    value={data.ordersToday ?? 0}      loading={loading} />
        <KpiCard delay={CARD_DELAY * 5}  icon={IndianRupee}  bg="bg-green-100"    color="text-green-600" label="Revenue This Month" value={formatINR(data.monthRevenue ?? 0)} loading={loading} sub={`${data.orderCount ?? 0} orders`} />
        <KpiCard delay={CARD_DELAY * 6}  icon={Bike}         bg="bg-secondary/10" color="text-secondary"  label="Delivery Partners" value={data.deliveryPartners ?? 0} loading={loading} />
        <KpiCard delay={CARD_DELAY * 7}  icon={TrendingUp}   bg="bg-purple-100"   color="text-purple-600" label="Products Listed"  value={data.totalProducts ?? 0}    loading={loading} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg">Orders by Status</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-4 bg-bg rounded animate-pulse" />)}</div>
          ) : Object.keys(ordersByStatus).length === 0 ? (
            <p className="text-ink-2 text-sm">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <BarRow
                  key={status}
                  label={status}
                  value={Number(count)}
                  max={maxOrders}
                  color={status === 'DELIVERED' ? 'bg-success' : status === 'CANCELLED' ? 'bg-error' : 'bg-primary'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Users by role */}
        <div className="card space-y-4">
          <h2 className="font-extrabold text-lg">Users by Role</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-4 bg-bg rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Farmers',          value: data.activeFarmers ?? 0,     color: 'bg-success' },
                { label: 'Buyers',           value: data.totalBuyers ?? 0,       color: 'bg-primary' },
                { label: 'Delivery Partners',value: data.deliveryPartners ?? 0,  color: 'bg-secondary' },
              ].map(row => (
                <BarRow key={row.label} label={row.label} value={row.value} max={data.totalUsers || 1} color={row.color} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h2 className="font-extrabold text-lg mb-4">Platform Summary</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Verifications', value: data.pendingVerifications ?? 0, color: 'text-yellow-600' },
            { label: 'Pending Products',      value: data.pendingProducts ?? 0,      color: 'text-orange-600' },
            { label: 'Delivered Orders',      value: data.deliveredOrders ?? 0,      color: 'text-success'   },
          ].map(item => (
            <div key={item.label} className="bg-bg rounded-xl p-4 text-center">
              <div className={`text-3xl font-extrabold ${item.color}`}>{loading ? '…' : item.value}</div>
              <div className="text-sm text-ink-2 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
