'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Truck,
  Package,
  MapPin,
  Phone,
  Check,
  Navigation,
  ArrowUpDown,
  Search,
  Zap,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  Map as MapIcon,
  RefreshCw,
  User,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import client, { deliveryApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/common/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 gap-2 font-medium text-xs">
      <Loader2 className="size-4 animate-spin text-emerald-500" />
      <span>Loading Interactive Route Map...</span>
    </div>
  ),
});

type SortOption = 'distance' | 'earnings' | 'priority' | 'time';
type ActiveTab = 'available' | 'assigned';

interface OrderItem {
  id: string;
  orderId?: string;
  totalAmount: number;
  deliveryFee?: number;
  distance?: number;
  estimatedMinutes?: number;
  priority?: 'HIGH' | 'EXPRESS' | 'STANDARD';
  status: string;
  farmerName?: string;
  farmerPhone?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  buyerName?: string;
  buyerPhone?: string;
  dropAddress?: string;
  dropLat?: number;
  dropLng?: number;
  itemCount?: number;
}

export default function DeliveryHome() {
  const router = useRouter();
  const [available, setAvailable] = useState<OrderItem[]>([]);
  const [assigned, setAssigned] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('available');
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<OrderItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [searchQuery, setSearchQuery] = useState('');

  const locIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.get('/api/delivery/orders').catch(() => ({ data: { data: [] } })),
      client.get('/api/delivery/orders/available').catch(() => ({ data: { data: [] } })),
    ])
      .then(([a, p]) => {
        const assignedData = (a as any).data?.data ?? [];
        const availableData = (p as any).data?.data ?? [];

        setAssigned(assignedData);
        setAvailable(availableData);

        if (assignedData.length > 0) {
          setActiveTab('assigned');
          setSelectedOrderForPreview(assignedData[0]);
        } else if (availableData.length > 0) {
          setSelectedOrderForPreview(availableData[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time location tracking
  const sendLocation = useCallback(async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    setCurrentCoords([lat, lng]);
    try {
      await deliveryApi.updateLocation(lat, lng);
    } catch {}
  }, []);

  useEffect(() => {
    if (!online) {
      if (locIntervalRef.current) clearInterval(locIntervalRef.current);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { enableHighAccuracy: true });
      locIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { enableHighAccuracy: true });
      }, 15000);
    }

    return () => {
      if (locIntervalRef.current) clearInterval(locIntervalRef.current);
    };
  }, [online, sendLocation]);

  const toggleOnline = async () => {
    const newState = !online;
    setOnline(newState);
    try {
      await deliveryApi.updateAvailability(newState);
      toast.success(newState ? '🟢 Duty Online — Live GPS tracking enabled' : '⚪ Duty Offline — Shift ended');
    } catch {
      toast.error('Failed to update status');
      setOnline(!newState);
    }
  };

  const claim = async (id: string) => {
    setBusyId(id);
    try {
      await client.post(`/api/delivery/orders/${id}/claim`);
      toast.success('🎉 Order claimed successfully!');
      router.push(`/delivery/orders/${id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not claim order');
      setBusyId(null);
    }
  };

  // Filter & sort available orders
  const sortedAvailable = useMemo(() => {
    let filtered = available.filter((o) => {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.farmerName && o.farmerName.toLowerCase().includes(q)) ||
        (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
        (o.pickupAddress && o.pickupAddress.toLowerCase().includes(q))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'distance') return (a.distance ?? 0) - (b.distance ?? 0);
      if (sortBy === 'earnings') return (b.deliveryFee ?? 0) - (a.deliveryFee ?? 0);
      if (sortBy === 'priority') {
        const pMap = { EXPRESS: 3, HIGH: 2, STANDARD: 1 };
        return (pMap[b.priority || 'STANDARD'] || 1) - (pMap[a.priority || 'STANDARD'] || 1);
      }
      if (sortBy === 'time') return (a.estimatedMinutes ?? 0) - (b.estimatedMinutes ?? 0);
      return 0;
    });
  }, [available, sortBy, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner - Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 font-semibold text-sm">
              <Sparkles className="size-4 animate-spin text-yellow-300" /> Partner Console
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">Delivery Dispatch Hub</h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Claim delivery orders, view farm-to-buyer routes, and manage pick-up navigation.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-extrabold text-sm transition shadow-lg ${
                online
                  ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30'
              }`}
            >
              <span className={`size-3.5 rounded-full ${online ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
              <span>{online ? 'DUTY ONLINE' : 'DUTY OFFLINE'}</span>
            </button>

            <button
              onClick={load}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition text-white border border-white/20"
              title="Refresh Orders"
            >
              <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Quick Navigation Tabs: Available Pool vs Active Deliveries */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 ${
              activeTab === 'available'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Package className="size-4" /> Available Pool ({available.length})
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-extrabold transition flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="size-4" /> My Active Deliveries ({assigned.length})
          </button>
        </div>

        {/* Controls: Search & Sort for Pool */}
        {activeTab === 'available' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter area or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <ArrowUpDown className="size-3.5 text-slate-400 ml-2" />
              {(['distance', 'earnings', 'priority'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition ${
                    sortBy === opt ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Available Delivery Pool */}
      {activeTab === 'available' && (
        <section className="space-y-4">
          {!loading && sortedAvailable.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center bg-slate-50">
              <Package className="size-12 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-slate-600 font-bold">No available delivery orders nearby right now.</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon or refresh your console.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sortedAvailable.map((o) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 space-y-4 hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Earn</span>
                        <span className="text-lg font-black text-emerald-600">{formatINR(o.deliveryFee || 40)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2 bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                        <Package className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800 block">Pickup: Farm Location</strong>
                          <span className="text-slate-600">{o.pickupAddress || 'Farm Location'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                        <MapPin className="size-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-indigo-800 block">Dropoff: Buyer Location</strong>
                          <span className="text-slate-600">{o.dropAddress || 'Buyer Address'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => claim(o.id)}
                    disabled={busyId === o.id}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
                  >
                    {busyId === o.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <span>Claim & Open Order Navigation</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: My Active Deliveries */}
      {activeTab === 'assigned' && (
        <section className="space-y-4">
          {!loading && assigned.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center bg-slate-50">
              <Truck className="size-12 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-slate-600 font-bold">You have no active deliveries in progress.</p>
              <p className="text-xs text-slate-400 mt-1">Switch to the "Available Pool" tab to claim orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assigned.map((o) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-3 py-1 rounded-xl text-slate-800">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-xs font-black uppercase px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block font-medium">Farm Pickup</span>
                        <strong className="text-slate-800">{o.farmerName || 'Farmer'}</strong>
                        <span className="text-slate-500 block truncate">{o.pickupAddress || 'Farm Location'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Buyer Dropoff</span>
                        <strong className="text-slate-800">{o.buyerName || 'Buyer'}</strong>
                        <span className="text-slate-500 block truncate">{o.dropAddress || 'Buyer Address'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-medium">Earnings</span>
                      <span className="text-xl font-black text-emerald-600">{formatINR(o.deliveryFee || 40)}</span>
                    </div>

                    <Link
                      href={`/delivery/orders/${o.id}`}
                      className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Navigation className="size-4" />
                      <span>Start Navigation & Verify</span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
