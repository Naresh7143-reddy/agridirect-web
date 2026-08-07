'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Package,
  MapPin,
  Phone,
  User,
  Truck,
  Check,
  Navigation,
  ShieldCheck,
  Map as MapIcon,
  CheckSquare,
  Square,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import client, { deliveryApi } from '@/lib/api';
import { geocodeAddressText } from '@/lib/geocoding';
import { formatINR } from '@/lib/utils';
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/common/OrderMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 gap-2 font-medium">
      <Loader2 className="size-6 animate-spin text-emerald-500" />
      <span>Loading Interactive Route Map...</span>
    </div>
  ),
});

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

export default function DeliveryOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const [resolvedDropLoc, setResolvedDropLoc] = useState<[number, number] | undefined>(undefined);
  const [resolvedPickupLoc, setResolvedPickupLoc] = useState<[number, number] | undefined>(undefined);

  const locIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrder = useCallback(() => {
    setLoading(true);
    client
      .get(`/api/delivery/orders/${id}`)
      .then((r) => {
        const data = r.data?.data ?? r.data;
        setOrder(data);

        // Resolve drop & pickup coordinates dynamically
        const rawPLat = data?.pickupLat ?? data?.farmerLat;
        const rawPLng = data?.pickupLng ?? data?.farmerLng;
        const rawDLat = data?.dropLat ?? data?.deliveryLat ?? (typeof data?.deliveryAddress === 'object' ? data?.deliveryAddress?.lat : null);
        const rawDLng = data?.dropLng ?? data?.deliveryLng ?? (typeof data?.deliveryAddress === 'object' ? data?.deliveryAddress?.lng : null);

        if (rawPLat && rawPLng && Number(rawPLat) !== 0) {
          setResolvedPickupLoc([Number(rawPLat), Number(rawPLng)]);
        } else if (data?.pickupAddress) {
          geocodeAddressText(data.pickupAddress).then((geo) => {
            if (geo) setResolvedPickupLoc([geo.lat, geo.lng]);
          });
        }

        const addrStr = typeof data?.dropAddress === 'object' && data?.dropAddress !== null
          ? [data.dropAddress.line1 || data.dropAddress.label, data.dropAddress.city, data.dropAddress.state, data.dropAddress.pincode].filter(Boolean).join(', ')
          : String(data?.dropAddress || data?.deliveryAddress || '');

        if (rawDLat && rawDLng && Number(rawDLat) !== 0) {
          setResolvedDropLoc([Number(rawDLat), Number(rawDLng)]);
        } else if (addrStr && addrStr !== 'Buyer Address') {
          geocodeAddressText(addrStr).then((geo) => {
            if (geo) setResolvedDropLoc([geo.lat, geo.lng]);
          });
        }
      })
      .catch(() => {
        toast.error('Could not load order details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Live GPS tracking
  const sendLocation = useCallback(async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    setCurrentCoords([lat, lng]);
    try {
      await deliveryApi.updateLocation(lat, lng);
    } catch {}
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { enableHighAccuracy: true });
      locIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation, () => {}, { enableHighAccuracy: true });
      }, 12000);
    }
    return () => {
      if (locIntervalRef.current) clearInterval(locIntervalRef.current);
    };
  }, [sendLocation]);

  const updateStatus = async (newStatus: string) => {
    setBusy(true);
    try {
      await client.put(`/api/delivery/orders/${id}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      loadOrder();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update status');
    } finally {
      setBusy(false);
    }
  };

  const openGoogleMaps = (addressStr?: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (addressStr) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(addressStr)}`, '_blank');
    }
  };

  const toggleItemCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <span className="text-sm font-semibold text-slate-500">Loading order & navigation details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 card max-w-xl mx-auto rounded-3xl p-8 border border-slate-200">
        <Package className="size-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link href="/delivery" className="btn-primary mt-6 inline-flex">
          ← Back to Deliveries
        </Link>
      </div>
    );
  }

  const currentStepIdx = getStatusIndex(order.status);
  const statusUpper = order.status?.toUpperCase() ?? '';
  const isPickedUp = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED'].includes(statusUpper);

  // Coordinate resolution
  const rawPickupLat = order.pickupLat ?? order.farmerLat;
  const rawPickupLng = order.pickupLng ?? order.farmerLng;
  const rawDropLat = order.dropLat ?? order.deliveryLat ?? (typeof order.deliveryAddress === 'object' ? order.deliveryAddress?.lat : null);
  const rawDropLng = order.dropLng ?? order.deliveryLng ?? (typeof order.deliveryAddress === 'object' ? order.deliveryAddress?.lng : null);

  const pickupLoc: [number, number] | undefined =
    resolvedPickupLoc ||
    (rawPickupLat && rawPickupLng && Number(rawPickupLat) !== 0
      ? [Number(rawPickupLat), Number(rawPickupLng)]
      : undefined);

  const dropLoc: [number, number] | undefined =
    resolvedDropLoc ||
    (rawDropLat && rawDropLng && Number(rawDropLat) !== 0
      ? [Number(rawDropLat), Number(rawDropLng)]
      : undefined);

  const addressDisplay = typeof order.dropAddress === 'object' && order.dropAddress !== null
    ? [order.dropAddress.line1 || order.dropAddress.label, order.dropAddress.city, order.dropAddress.state, order.dropAddress.pincode].filter(Boolean).join(', ')
    : String(order.dropAddress || order.deliveryAddress || 'Buyer Address');

  const itemsList = order.items ?? [];
  const allItemsChecked = itemsList.length > 0 && itemsList.every((_: any, i: number) => checkedItems[i]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push('/delivery')}
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition text-sm"
        >
          <ArrowLeft className="size-5" /> Back to Delivery Console
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-xs font-black uppercase px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {order.status?.replace(/_/g, ' ')}
          </span>
          <button
            onClick={loadOrder}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh Order Data"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <MapIcon className="size-5 text-emerald-600" /> Navigation Route Map
          </div>
          <div className="text-xs font-bold text-slate-500">
            Phase: <span className="text-emerald-600 uppercase font-black">{isPickedUp ? 'Farm ➔ Buyer Delivery' : 'Partner ➔ Farm Pickup'}</span>
          </div>
        </div>
        <div className="h-[380px] w-full relative">
          <OrderMap
            agentLocation={currentCoords || undefined}
            pickupLocation={pickupLoc}
            dropLocation={dropLoc}
            isPickedUp={isPickedUp}
          />
        </div>
      </section>

      {/* Status Timeline & Quick Action Buttons */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-6"
      >
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Delivery Progress Steps</span>
          <div className="grid grid-cols-5 gap-2 relative pt-1">
            {STATUS_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                  <div
                    className={`size-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-emerald-500/20 scale-110' : ''}`}
                  >
                    <StepIcon className="size-5" />
                  </div>
                  <span className={`text-xs font-bold ${isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Estimated Delivery Earning:</span>
            <span className="text-xl font-black text-emerald-600">{formatINR(order.deliveryFee || 40)}</span>
          </div>

          <div className="flex items-center gap-3">
            {currentStepIdx === 0 && (
              <button
                onClick={() => updateStatus('REACHED_FARM')}
                disabled={busy}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : '🚜 Mark Reached Farm'}
              </button>
            )}

            {currentStepIdx <= 1 && (
              <button
                onClick={() => updateStatus('PICKED_UP')}
                disabled={busy}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : '📦 Confirm Picked Up from Farm'}
              </button>
            )}

            {currentStepIdx >= 2 && currentStepIdx < 4 && (
              <Link
                href={`/delivery/orders/${order.id}/pod`}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <ShieldCheck className="size-5" /> Verify Buyer OTP & Complete Delivery
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* 3-Column Logistics Grid: Farmer, Order Items Verification, Buyer */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 1. Farm Pickup Details */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                <Package className="size-4" /> 1. Farm Pickup Details
              </span>
              <button
                onClick={() => openGoogleMaps(order.pickupAddress, pickupLoc?.[0], pickupLoc?.[1])}
                className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition text-xs font-bold flex items-center gap-1"
              >
                <Navigation className="size-3.5" /> Navigate
              </button>
            </div>

            <div>
              <div className="font-extrabold text-lg text-slate-900">{order.farmerName || 'Farm Owner'}</div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">{order.pickupAddress || 'Farm Location'}</div>
            </div>

            {order.farmerPhone && (
              <a
                href={`tel:${order.farmerPhone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm"
              >
                <Phone className="size-4" /> Call Farmer ({order.farmerPhone})
              </a>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Verify produce quality & packaging before departing farm.
          </div>
        </div>

        {/* 2. Item Verification List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckSquare className="size-4 text-emerald-600" /> 2. Items Verification ({itemsList.length})
            </span>
            {allItemsChecked && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                ✓ All Verified
              </span>
            )}
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {itemsList.length > 0 ? (
              itemsList.map((it: any, idx: number) => {
                const checked = !!checkedItems[idx];
                const price = it.priceAtOrder ?? it.pricePerUnit ?? it.price ?? 0;

                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemCheck(idx)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      checked
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {checked ? (
                        <CheckSquare className="size-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="size-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-slate-800">{it.productName || it.name || 'Produce Item'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Quantity: <strong className="text-slate-700">{it.quantity} {it.unit || 'kg'}</strong> × {formatINR(price)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">{formatINR(price * (it.quantity || 1))}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">No items listed</div>
            )}
          </div>
        </div>

        {/* 3. Buyer Dropoff Details */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-black text-indigo-600 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="size-4" /> 3. Buyer Dropoff Details
              </span>
              <button
                onClick={() => openGoogleMaps(addressDisplay, dropLoc?.[0], dropLoc?.[1])}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition text-xs font-bold flex items-center gap-1"
              >
                <Navigation className="size-3.5" /> Navigate
              </button>
            </div>

            <div>
              <div className="font-extrabold text-lg text-slate-900">{order.buyerName || 'Buyer'}</div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5 leading-snug">{addressDisplay}</div>
            </div>

            {order.buyerPhone && (
              <a
                href={`tel:${order.buyerPhone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Phone className="size-4" /> Call Buyer ({order.buyerPhone})
              </a>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Ask buyer for their 4-digit Delivery OTP upon arrival.
          </div>
        </div>
      </div>
    </div>
  );
}
