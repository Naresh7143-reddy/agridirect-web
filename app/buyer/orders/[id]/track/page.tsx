'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Navigation, Package, MapPin, Truck, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi, deliveryApi } from '@/lib/api';
import { motion } from 'framer-motion';
// Dynamic import for Leaflet map to avoid SSR issues
import dynamic from 'next/dynamic';

const OrderMap = dynamic(() => import('@/components/common/OrderMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-border/20 flex items-center justify-center text-ink-3">Loading map...</div>
});

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLocation = async () => {
    try {
      const res = await deliveryApi.getLocation(id);
      setLocation(res.data || res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    buyerApi.getOrder(id)
      .then((r) => setOrder(r.data ?? r))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));

    fetchLocation();

    // Polling fallback for live location updates (EventSource cannot send Bearer tokens)
    const pollInterval = setInterval(fetchLocation, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  if (!order) return <div className="text-center py-20 font-bold">Order not found</div>;

  // Resolve coordinates from backend order & location responses
  const agentLat = location?.lat ?? location?.latitude ?? null;
  const agentLng = location?.lng ?? location?.longitude ?? null;

  const dropLat = order?.dropLat ?? order?.deliveryLat ?? (typeof order?.deliveryAddress === 'object' ? order?.deliveryAddress?.lat : null);
  const dropLng = order?.dropLng ?? order?.deliveryLng ?? (typeof order?.deliveryAddress === 'object' ? order?.deliveryAddress?.lng : null);

  const pickupLat = order?.pickupLat ?? order?.farmerLat ?? null;
  const pickupLng = order?.pickupLng ?? order?.farmerLng ?? null;

  const agentLocation: [number, number] | undefined = agentLat && agentLng && agentLat !== 0 ? [Number(agentLat), Number(agentLng)] : undefined;
  const pickupLocation: [number, number] | undefined = pickupLat && pickupLng ? [Number(pickupLat), Number(pickupLng)] : undefined;
  const dropLocation: [number, number] | undefined = dropLat && dropLng && Number(dropLat) !== 0 ? [Number(dropLat), Number(dropLng)] : pickupLocation ? [pickupLocation[0] + 0.015, pickupLocation[1] + 0.015] : undefined;

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-ink-2 hover:text-primary transition">
          <ArrowLeft className="size-5" /> Back to Order
        </button>
        <div className="font-bold text-primary flex items-center gap-2">
          <Navigation className="size-5" /> Live Tracking
        </div>
      </div>

      <div className="flex-1 rounded-3xl overflow-hidden shadow-card border-2 border-border relative">
        <OrderMap 
          agentLocation={agentLocation}
          dropLocation={dropLocation}
          pickupLocation={pickupLocation}
        />
        
        {/* Overlay Info Card - Swiggy/Zomato Style */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-xl border border-border p-5 z-[1000]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl border-2 border-emerald-500">
                {location?.agentName ? location.agentName.charAt(0).toUpperCase() : '🚲'}
              </div>
              <div>
                <div className="font-extrabold text-ink-1 text-base">{location?.agentName || 'Delivery Partner'}</div>
                <div className="flex items-center gap-2 text-xs text-ink-2 mt-0.5">
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                    ⭐ {(location?.rating || 4.5).toFixed(1)}
                  </span>
                  <span>• {location?.vehicleType || 'BIKE'} {location?.vehicleRegistration ? `(${location.vehicleRegistration})` : ''}</span>
                </div>
              </div>
            </div>

            {location?.agentPhone && (
              <a
                href={`tel:${location.agentPhone}`}
                className="size-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0"
                title="Call Delivery Partner"
              >
                <Phone className="size-5" />
              </a>
            )}
          </div>
          
          <div className="space-y-2.5 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-ink-2 font-medium">
              <span>Status: <strong className="text-emerald-600 uppercase">{location?.status?.replace(/_/g, ' ') || 'ON THE WAY'}</strong></span>
              {location?.totalDeliveries ? <span>{location.totalDeliveries} orders delivered</span> : null}
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-primary shrink-0" />
              <div className="text-sm font-semibold text-ink-1 truncate">
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : order.deliveryAddress?.label || 'Delivery Address'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
