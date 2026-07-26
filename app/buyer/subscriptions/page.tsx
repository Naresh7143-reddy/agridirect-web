'use client';

import { useState, useEffect } from 'react';
import { subscriptionsApi } from '@/lib/api';
import { Loader2, CalendarDays, CheckCircle2, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      const res = await subscriptionsApi.listBuyer();
      setSubscriptions(res.data || res || []);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await subscriptionsApi.cancel(id);
      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <CalendarDays className="size-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-ink-1">My Subscriptions</h1>
          <p className="text-ink-2 mt-1">Manage your recurring deliveries</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-border">
          <Package className="size-16 text-ink-3 mx-auto mb-4" />
          <h2 className="text-xl font-bold">No active subscriptions</h2>
          <p className="text-ink-2 mt-2">Subscribe to products to get them delivered automatically.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub, index) => {
            const isActive = sub.status === 'ACTIVE';
            return (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card border-2 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center ${isActive ? 'border-primary/20' : 'border-border opacity-60'}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isActive ? 'bg-success/10 text-success' : 'bg-ink-3 text-white'}`}>
                      {isActive ? <CheckCircle2 className="size-3 inline mr-1" /> : <XCircle className="size-3 inline mr-1" />}
                      {sub.status}
                    </span>
                    <span className="font-mono bg-border/50 px-2 py-0.5 rounded text-xs text-ink-2">Sub: {sub.id?.slice(0,8).toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink-1 flex items-center gap-2">
                    {sub.quantity}x Deliveries · <span className="text-primary">{sub.frequency.replace('_', ' ')}</span>
                  </h3>
                  <div className="text-sm text-ink-2 mt-1">
                    Started on {new Date(sub.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {isActive && (
                  <button 
                    onClick={() => handleCancel(sub.id)} 
                    disabled={cancelling === sub.id}
                    className="btn-secondary text-error hover:bg-error/10 w-full md:w-auto shrink-0"
                  >
                    {cancelling === sub.id ? <Loader2 className="size-4 animate-spin mr-2" /> : 'Cancel Subscription'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
