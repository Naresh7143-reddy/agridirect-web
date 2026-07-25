'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Navigation, CheckCircle2, Clock, Package, Truck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi, API_URL } from '@/lib/api';
import Cookies from 'js-cookie';

const OrderMap = dynamic(() => import('@/components/common/OrderMap'), { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-bg animate-pulse text-primary"><Loader2 className="size-8 animate-spin" /></div> });

const STEPS = [
  { key: 'PENDING',    label: 'Placed',     icon: Clock },
  { key: 'ACCEPTED',   label: 'Accepted',   icon: CheckCircle2 },
  { key: 'PACKED',     label: 'Packed',      icon: Package },
  { key: 'PICKED_UP',  label: 'Picked Up',   icon: Truck },
  { key: 'ON_THE_WAY', label: 'On the Way',  icon: Navigation },
  { key: 'DELIVERED',  label: 'Delivered',    icon: CheckCircle2 },
];

function statusIndex(status: string) {
  if (status === 'CANCELLED') return -1;
  return STEPS.findIndex((s) => s.key === status);
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Locations (Lat, Lng)
  const [agentLocation, setAgentLocation] = useState<[number, number] | undefined>(undefined);
  const [dropLocation, setDropLocation] = useState<[number, number] | undefined>(undefined);
  const [pickupLocation, setPickupLocation] = useState<[number, number] | undefined>(undefined);

  // 1. Initial Load
  useEffect(() => {
    buyerApi.getOrder(id)
      .then((r) => {
        const o = r.data ?? r;
        setOrder(o);
        // Set static locations if available
        if (o.deliveryAddress?.lat && o.deliveryAddress?.lng) {
          setDropLocation([o.deliveryAddress.lat, o.deliveryAddress.lng]);
        }
        if (o.farmer?.location?.lat && o.farmer?.location?.lng) {
          setPickupLocation([o.farmer.location.lat, o.farmer.location.lng]);
        }
      })
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Real-time updates (SSE + Polling fallback)
  useEffect(() => {
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    const token = Cookies.get('access_token');

    // Attempt SSE
    try {
      // Pass token in URL for SSE since headers aren't supported natively in EventSource
      eventSource = new EventSource(`${API_URL}/api/buyer/orders/${id}/stream?token=${token}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status) setOrder((prev: any) => ({ ...prev, status: data.status }));
          if (data.agentLocation) setAgentLocation([data.agentLocation.lat, data.agentLocation.lng]);
        } catch (e) {}
      };
      
      eventSource.onerror = () => {
        // Fallback to polling if SSE fails
        eventSource?.close();
        startPolling();
      };
    } catch (err) {
      startPolling();
    }

    function startPolling() {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(async () => {
        try {
          // Poll both status and location
          const r = await fetch(`${API_URL}/api/buyer/orders/${id}/agent-location`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (r.ok) {
            const data = await r.json();
            if (data.status) setOrder((prev: any) => ({ ...prev, status: data.status }));
            if (data.agentLocation) setAgentLocation([data.agentLocation.lat, data.agentLocation.lng]);
          }
        } catch (e) {}
      }, 10000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, order?.status]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  if (!order) return <div className="text-center py-20">Order not found</div>;

  const currentStep = statusIndex(order.status);
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-ink-2 hover:text-primary transition">
          <ArrowLeft className="size-5" /> Back to Order
        </button>
        <div className="text-xs font-mono text-ink-3">Order #{String(order.id).slice(0, 8).toUpperCase()}</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Col: Timeline & Details */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-4">
          <div className="card shrink-0">
            <h1 className="text-2xl font-extrabold mb-1">Live Tracking</h1>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold mt-2 ${
              isCancelled ? 'bg-error/10 text-error'
              : isDelivered ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary'
            }`}>
              {isCancelled ? <Info className="size-4" /> : isDelivered ? <CheckCircle2 className="size-4" /> : <Navigation className="size-4 animate-pulse" />}
              {order.status?.replace(/_/g, ' ')}
            </div>
          </div>

          {!isCancelled && (
            <div className="card flex-1 min-h-[300px]">
              <h2 className="font-extrabold text-lg mb-6">Status Timeline</h2>
              <div className="relative pl-6 space-y-8">
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-border -ml-px" />
                <div 
                  className="absolute left-8 top-4 w-0.5 bg-primary -ml-px transition-all duration-500" 
                  style={{ height: currentStep > 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }}
                />
                
                {STEPS.map((step, i) => {
                  const isComplete = currentStep >= i;
                  const isCurrent = currentStep === i;
                  return (
                    <div key={step.key} className="relative flex items-center gap-4 z-10">
                      <div className={`size-10 rounded-full flex items-center justify-center transition-all ${
                        isComplete
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white border-2 border-border text-ink-3'
                      } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                        <step.icon className="size-4" />
                      </div>
                      <div>
                        <div className={`font-bold ${isComplete ? 'text-ink-1' : 'text-ink-3'}`}>{step.label}</div>
                        {isCurrent && !isDelivered && (
                          <div className="text-xs text-primary font-semibold mt-0.5 animate-pulse">In progress...</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isDelivered && (
            <div className="card bg-success/10 border-2 border-success/20">
              <h3 className="font-bold text-success flex items-center gap-2"><CheckCircle2 className="size-5" /> Delivered Successfully</h3>
              <p className="text-sm text-success/80 mt-1">Thank you for shopping with AgriDirect!</p>
            </div>
          )}
        </div>

        {/* Right Col: Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-card border border-border relative bg-bg min-h-[400px]">
          <OrderMap 
            agentLocation={agentLocation} 
            dropLocation={dropLocation} 
            pickupLocation={pickupLocation} 
          />
          
          {/* Overlay info */}
          <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex justify-between gap-2">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-md border border-border/50 pointer-events-auto">
              <div className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">Estimated Arrival</div>
              <div className="text-lg font-extrabold text-primary">15-20 min</div>
            </div>
            
            {agentLocation && (
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-md border border-border/50 pointer-events-auto flex flex-col items-end">
                <div className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">Agent Status</div>
                <div className="text-sm font-bold text-success flex items-center gap-1.5"><div className="size-2 rounded-full bg-success animate-pulse" /> On the way</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
