'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Navigation, Package, MapPin, Truck } from 'lucide-react';
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

    // Use SSE (Server-Sent Events) for real-time order status & tracking updates
    const token = typeof window !== 'undefined' ? require('js-cookie').get('access_token') : null;
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://agridirect-backend-80yz.onrender.com'}/api/buyer/orders/${id}/stream`;
    
    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    if (token) {
      // EventSource doesn't support custom headers by default, but we can pass token via query parameter or cookies if handled by browser.
      // Since backend authenticates the stream session, we attempt to initialize it:
      try {
        eventSource = new EventSource(sseUrl, { withCredentials: true });
        
        eventSource.addEventListener('location', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.lat !== undefined && data.lng !== undefined) {
              setLocation({ latitude: data.lat, longitude: data.lng, status: data.status });
            }
          } catch (e) {
            console.error('Error parsing SSE location:', e);
          }
        });

        eventSource.addEventListener('status', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.status) {
              setOrder((prev: any) => prev ? { ...prev, status: data.status } : prev);
            }
          } catch (e) {
            console.error('Error parsing SSE status:', e);
          }
        });

        eventSource.onerror = () => {
          console.warn('SSE connection failed. Falling back to polling...');
          if (eventSource) eventSource.close();
          // Fallback to polling if SSE fails
          pollInterval = setInterval(fetchLocation, 5000);
        };
      } catch (err) {
        console.error('Failed to initialize SSE:', err);
        pollInterval = setInterval(fetchLocation, 5000);
      }
    } else {
      pollInterval = setInterval(fetchLocation, 5000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  if (!order) return <div className="text-center py-20 font-bold">Order not found</div>;

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
          agentLocation={location ? [location.latitude, location.longitude] : undefined}
          dropLocation={
            order.deliveryAddress?.lat && order.deliveryAddress?.lng 
              ? [order.deliveryAddress.lat, order.deliveryAddress.lng] 
              : order.deliveryAddress 
                ? [17.3850, 78.4867] 
                : undefined
          }
        />
        
        {/* Overlay Info Card */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-lg border border-border p-4 z-[1000]">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="size-5" />
            </div>
            <div>
              <div className="font-bold text-ink-1">Arriving Soon</div>
              <div className="text-sm text-ink-2">Your delivery agent is on the way.</div>
            </div>
          </div>
          
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-ink-3 shrink-0" />
              <div className="text-sm text-ink-1 truncate">{order.deliveryAddress?.label || 'Delivery Address'}</div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="size-4 text-ink-3 shrink-0" />
              <div className="text-sm text-ink-1 truncate">{order.totalAmount} INR</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
