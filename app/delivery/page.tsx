'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Loader2,
  Truck,
  Package,
  MapPin,
  Phone,
  User,
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
} from 'lucide-react';
import { toast } from 'sonner';
import client, { deliveryApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/common/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-900/10 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl flex items-center justify-center text-slate-400 gap-2 font-medium">
      <Loader2 className="size-5 animate-spin text-emerald-500" />
      <span>Loading Interactive Route Map...</span>
    </div>
  ),
});

type SortOption = 'distance' | 'earnings' | 'priority' | 'time';

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

const STATUS_STEPS = [
  { key: 'ASSIGNED', label: 'Assigned', icon: Package },
  { key: 'REACHED_FARM', label: 'Reached Farm', icon: MapPin },
  { key: 'PICKED_UP', label: 'Picked Up', icon: Truck },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: Navigation },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];

function getStatusIndex(status: string) {
  const norm = status?.toUpperCase() ?? '';
  if (norm === 'DELIVERED') return 4;
  if (norm === 'IN_TRANSIT' || norm === 'ON_THE_WAY') return 3;
  if (norm === 'PICKED_UP') return 2;
  if (norm === 'REACHED_FARM') return 1;
  return 0;
}

export default function DeliveryHome() {
  const [available, setAvailable] = useState<OrderItem[]>([]);
  const [assigned, setAssigned] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [selectedOrderForMap, setSelectedOrderForMap] = useState<OrderItem | null>(null);
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
          setSelectedOrderForMap(assignedData[0]);
        } else if (availableData.length > 0) {
          setSelectedOrderForMap(availableData[0]);
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
      toast.success(newState ? "🟢 Online — Live GPS tracking enabled" : "⚪ Offline — Shift ended");
    } catch {
      toast.error('Failed to update status');
      setOnline(!newState);
    }
  };

  const claim = async (id: string) => {
    setBusyId(id);
    try {
      await client.post(`/api/delivery/orders/${id}/claim`);
      toast.success('🎉 Order claimed! Check your active deliveries.');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not claim order');
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await client.put(`/api/delivery/orders/${id}/status`, { status });
      toast.success(`Updated order status to ${status.replace(/_/g, ' ')}`);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const openMaps = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
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
    <div className="space-y-8 pb-12">
      {/* Top Banner - Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-6 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 font-semibold text-sm">
              <Sparkles className="size-4 animate-spin text-yellow-300" /> Live Partner Console
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">Delivery Dispatch Hub</h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Track real-time orders, manage pick-up routes with live GPS, and claim high-demand deliveries.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-extrabold text-sm transition-all duration-300 shadow-lg ${
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
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition text-white border border-white/20 backdrop-blur-md"
              title="Refresh Orders"
            >
              <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Interactive Leaflet Route Map Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <MapIcon className="size-5 text-emerald-500" /> Interactive Route Map & GPS Tracker
          </h2>
          {selectedOrderForMap && (
            <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20">
              Tracking #{selectedOrderForMap.id.slice(0, 8)}
            </span>
          )}
        </div>

        <div className="h-[380px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative backdrop-blur-md bg-white/50 dark:bg-slate-900/50">
          {(() => {
            const statusUpper = selectedOrderForMap?.status?.toUpperCase() ?? '';
            const isPickedUp = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED'].includes(statusUpper);

            const pickupLoc: [number, number] | undefined =
              selectedOrderForMap?.pickupLat && selectedOrderForMap?.pickupLng
                ? [selectedOrderForMap.pickupLat, selectedOrderForMap.pickupLng]
                : undefined;

            const dropLoc: [number, number] | undefined =
              selectedOrderForMap?.dropLat && selectedOrderForMap?.dropLng
                ? [selectedOrderForMap.dropLat, selectedOrderForMap.dropLng]
                : undefined;

            return (
              <OrderMap
                agentLocation={currentCoords || undefined}
                pickupLocation={!isPickedUp ? pickupLoc : undefined}
                dropLocation={isPickedUp ? dropLoc : pickupLoc ? undefined : dropLoc}
              />
            );
          })()}
        </div>
      </section>

      {/* Active Deliveries Section with Status Timeline */}
      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Truck className="size-6 text-emerald-600" /> Your Active Deliveries ({assigned.length})
        </h2>

        {!loading && assigned.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <Package className="size-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No active deliveries assigned yet.</p>
            <p className="text-xs text-slate-400 mt-1">Claim an order from the available pool below to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assigned.map((o) => {
              const currentStepIdx = getStatusIndex(o.status);

              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl p-6 space-y-6"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {o.deliveryFee && (
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">Earning</span>
                          <span className="text-lg font-black text-emerald-600">{formatINR(o.deliveryFee)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedOrderForMap(o)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
                      >
                        <MapIcon className="size-3.5" /> View on Map
                      </button>
                    </div>
                  </div>

                  {/* Visual Status Timeline */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Timeline</span>
                    <div className="grid grid-cols-5 gap-2 relative pt-2">
                      {STATUS_STEPS.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center space-y-1.5 relative">
                            <div
                              className={`size-9 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                isDone
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
                            >
                              <StepIcon className="size-4" />
                            </div>
                            <span
                              className={`text-[11px] font-bold leading-tight ${
                                isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Route Logistics Grid (Pickup & Drop) */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Pickup Info */}
                    <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <Package className="size-3.5" /> Pickup — Farm
                        </span>
                        {o.pickupAddress && (
                          <button
                            onClick={() => openMaps(o.pickupAddress!)}
                            className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
                          >
                            <Navigation className="size-3" /> Nav
                          </button>
                        )}
                      </div>
                      {o.farmerName && <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{o.farmerName}</div>}
                      {o.farmerPhone && (
                        <a href={`tel:${o.farmerPhone}`} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:underline">
                          <Phone className="size-3 text-amber-600" /> {o.farmerPhone}
                        </a>
                      )}
                      {o.pickupAddress && <p className="text-xs text-slate-500 leading-snug">{o.pickupAddress}</p>}
                    </div>

                    {/* Drop Info */}
                    <div className="rounded-2xl border-l-4 border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <MapPin className="size-3.5" /> Drop — Buyer
                        </span>
                        {o.dropAddress && (
                          <button
                            onClick={() => openMaps(o.dropAddress!)}
                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <Navigation className="size-3" /> Nav
                          </button>
                        )}
                      </div>
                      {o.buyerName && <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{o.buyerName}</div>}
                      {o.buyerPhone && (
                        <a href={`tel:${o.buyerPhone}`} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:underline">
                          <Phone className="size-3 text-indigo-600" /> {o.buyerPhone}
                        </a>
                      )}
                      {o.dropAddress && <p className="text-xs text-slate-500 leading-snug">{o.dropAddress}</p>}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {currentStepIdx === 0 && (
                      <button
                        onClick={() => updateStatus(o.id, 'REACHED_FARM')}
                        disabled={busyId === o.id}
                        className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                      >
                        {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : '🚜 Reached Farm'}
                      </button>
                    )}

                    {currentStepIdx <= 1 && (
                      <button
                        onClick={() => updateStatus(o.id, 'PICKED_UP')}
                        disabled={busyId === o.id}
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                      >
                        {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : '📦 Confirm Picked Up'}
                      </button>
                    )}

                    {currentStepIdx >= 2 && currentStepIdx < 4 && (
                      <Link
                        href={`/delivery/orders/${o.id}/pod`}
                        className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                      >
                        <ShieldCheck className="size-4" /> Verify Buyer OTP & Complete Delivery
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Available Orders Pool Section with Sorting & Filtering */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Package className="size-6 text-teal-600" /> Available Delivery Pool ({sortedAvailable.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Claim available orders nearby and boost your daily earnings.</p>
          </div>

          {/* Controls: Search & Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <ArrowUpDown className="size-3.5 text-slate-400 ml-2" />
              {(['distance', 'earnings', 'priority', 'time'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                    sortBy === opt
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="size-8 animate-spin text-emerald-500 mx-auto" />
          </div>
        ) : sortedAvailable.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
            <Layers className="size-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No available orders matching your filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {sortedAvailable.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg p-5 space-y-4 hover:shadow-2xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Top Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      #{o.id.slice(0, 8)}
                    </span>
                    {o.priority && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="size-3 fill-amber-500" /> {o.priority}
                      </span>
                    )}
                  </div>

                  {/* Highlights Row */}
                  <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/10">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Pay per order</span>
                      <span className="text-xl font-black text-emerald-600">{formatINR(o.deliveryFee ?? 95)}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {o.distance && (
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                          📍 {o.distance} km
                        </span>
                      )}
                      {o.estimatedMinutes && (
                        <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                          ⏱️ {o.estimatedMinutes}m
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Pickup / Drop details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Pickup: </span>
                          <span className="text-slate-500">{o.farmerName || o.pickupAddress || 'Farm Location'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrderForMap(o)}
                        className="text-[11px] font-bold text-emerald-600 hover:underline shrink-0 flex items-center gap-1"
                      >
                        <MapIcon className="size-3" /> Map
                      </button>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="size-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Drop: </span>
                        <span className="text-slate-500">{o.buyerName || o.dropAddress || 'Delivery Address'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => claim(o.id)}
                  disabled={busyId === o.id}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 mt-2"
                >
                  {busyId === o.id ? <Loader2 className="size-4 animate-spin" /> : 'Claim Delivery'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
