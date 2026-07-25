'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, Package, Truck, MapPin,
  XCircle, Star, X, AlertTriangle, Navigation, Phone, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const load = () => {
    setLoading(true);
    buyerApi.getOrder(id)
      .then((r) => setOrder(r.data ?? r))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await buyerApi.cancelOrder(id);
      toast.success('Order cancelled');
      setShowCancelDialog(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleRate = async () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmittingRating(true);
    try {
      await buyerApi.rateOrder(id, { rating, review: review.trim() || undefined });
      toast.success('Thanks for your feedback! 🎉');
      setRatingSubmitted(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <XCircle className="size-16 text-ink-3 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Order not found</h2>
        <Link href="/buyer/orders" className="btn-primary mt-6 inline-flex">← Back to orders</Link>
      </div>
    );
  }

  const currentStep = statusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';
  const canTrack = ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-ink-2 hover:text-primary mb-6 transition">
        <ArrowLeft className="size-5" /> Back
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-ink-3">Order #{String(order.id).slice(0, 8).toUpperCase()}</div>
            <h1 className="text-2xl font-extrabold mt-1">Order Details</h1>
            <div className="text-sm text-ink-3 mt-1">
              {order.createdAt && new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
              isCancelled ? 'bg-error/10 text-error'
              : isDelivered ? 'bg-success/10 text-success'
              : 'bg-primary/10 text-primary'
            }`}>
              {isCancelled ? <XCircle className="size-4" /> : isDelivered ? <CheckCircle2 className="size-4" /> : <Truck className="size-4" />}
              {order.status?.replace(/_/g, ' ')}
            </div>
            <div className="text-2xl font-extrabold text-primary mt-2">{formatINR(order.totalAmount)}</div>
          </div>
        </div>
      </motion.div>

      {/* Status Timeline */}
      {!isCancelled && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card mb-6">
          <h2 className="font-extrabold text-lg mb-6">Order Timeline</h2>
          <div className="flex items-start justify-between relative">
            {/* Connector line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" style={{ marginLeft: '2rem', marginRight: '2rem' }} />
            <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500" style={{
              marginLeft: '2rem',
              width: currentStep >= 0 ? `${Math.min(currentStep / (STEPS.length - 1), 1) * (100 - (100 / STEPS.length))}%` : '0%',
            }} />
            {STEPS.map((step, i) => {
              const isComplete = currentStep >= i;
              const isCurrent = currentStep === i;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                  <div className={`size-10 rounded-full flex items-center justify-center transition-all ${
                    isComplete
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white border-2 border-border text-ink-3'
                  } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                    <step.icon className="size-4" />
                  </div>
                  <span className={`text-xs mt-2 font-semibold text-center ${isComplete ? 'text-primary' : 'text-ink-3'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6 border-2 border-error/20 bg-error/5">
          <div className="flex items-center gap-3">
            <XCircle className="size-8 text-error shrink-0" />
            <div>
              <div className="font-bold text-error">Order Cancelled</div>
              <div className="text-sm text-ink-2 mt-1">This order has been cancelled. {order.cancelledAt ? `on ${new Date(order.cancelledAt).toLocaleDateString('en-IN')}` : ''}</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — Items + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <h2 className="font-extrabold text-lg mb-4">Items</h2>
            <div className="space-y-3">
              {(order.items ?? []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-bg">
                  <div className="size-14 rounded-xl bg-gradient-to-br from-green-100 to-yellow-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {item.productImage || item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImage || item.imageUrl} alt={item.productName || item.name} className="w-full h-full object-cover" />
                    ) : '🥬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.productName || item.name}</div>
                    <div className="text-sm text-ink-2">
                      {item.quantity} × {formatINR(item.pricePerUnit || item.price)} / {item.unit || 'kg'}
                    </div>
                  </div>
                  <div className="font-extrabold text-primary shrink-0">
                    {formatINR((item.pricePerUnit || item.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-3">
            {order.status === 'PENDING' && (
              <button onClick={() => setShowCancelDialog(true)} className="flex items-center gap-2 rounded-full border-2 border-error px-6 py-3 font-semibold text-error hover:bg-error hover:text-white transition active:scale-95">
                <XCircle className="size-5" /> Cancel Order
              </button>
            )}
            {canTrack && (
              <Link href={`/buyer/orders/${id}/track`} className="btn-primary">
                <Navigation className="size-5" /> Track Delivery
              </Link>
            )}
          </motion.div>

          {/* Rating section — only for delivered orders */}
          {isDelivered && !ratingSubmitted && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
                <Star className="size-5 text-secondary" /> Rate this order
              </h2>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="transition hover:scale-110">
                    <Star className={`size-8 ${s <= rating ? 'fill-secondary text-secondary' : 'text-border'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none mb-4"
              />
              <button onClick={handleRate} disabled={submittingRating} className="btn-primary">
                {submittingRating ? <Loader2 className="size-5 animate-spin" /> : 'Submit Rating'}
              </button>
            </motion.div>
          )}
          {isDelivered && ratingSubmitted && (
            <div className="card bg-success/5 border-2 border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-6 text-success" />
                <div className="font-bold text-success">Thanks for your feedback!</div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Summary */}
        <div className="space-y-6">
          {/* Price breakdown */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <h2 className="font-extrabold text-lg mb-4">Price Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-2">Subtotal</span><span className="font-semibold">{formatINR(order.subtotal ?? order.totalAmount)}</span></div>
              {order.deliveryFee != null && <div className="flex justify-between"><span className="text-ink-2">Delivery</span><span className="font-semibold">{order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</span></div>}
              {order.platformFee != null && <div className="flex justify-between"><span className="text-ink-2">Platform fee</span><span className="font-semibold">{formatINR(order.platformFee)}</span></div>}
            </div>
            <div className="border-t border-border my-3" />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-extrabold text-primary">{formatINR(order.totalAmount)}</span>
            </div>
            <div className="mt-3 text-xs text-ink-3">
              Payment: <span className="font-semibold text-ink-1">{order.paymentMethod ?? 'COD'}</span>
            </div>
          </motion.div>

          {/* Delivery address */}
          {order.deliveryAddress && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
              <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><MapPin className="size-5 text-primary" /> Delivery Address</h2>
              <div className="text-sm text-ink-2 leading-relaxed">
                <div className="font-semibold text-ink-1">{order.deliveryAddress.label || 'Address'}</div>
                {order.deliveryAddress.line1 && <div>{order.deliveryAddress.line1}</div>}
                <div>{[order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean).join(', ')}</div>
                {order.deliveryAddress.pincode && <div>PIN: {order.deliveryAddress.pincode}</div>}
              </div>
            </motion.div>
          )}

          {/* Farmer info */}
          {(order.farmerName || order.farmer) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><User className="size-5 text-primary" /> Farmer</h2>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-extrabold">
                  {(order.farmerName || order.farmer?.name || 'F').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{order.farmerName || order.farmer?.name}</div>
                  {(order.farmerPhone || order.farmer?.phone) && (
                    <a href={`tel:${order.farmerPhone || order.farmer?.phone}`} className="text-sm text-primary flex items-center gap-1 hover:underline">
                      <Phone className="size-3" /> {order.farmerPhone || order.farmer?.phone}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCancelDialog(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
          >
            <div className="text-center mb-6">
              <div className="size-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="size-8 text-error" />
              </div>
              <h2 className="text-xl font-extrabold">Cancel Order?</h2>
              <p className="text-ink-2 mt-2 text-sm">This action cannot be undone. Your order will be cancelled immediately.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelDialog(false)} className="btn-secondary flex-1">Keep Order</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-error px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50">
                {cancelling ? <Loader2 className="size-5 animate-spin" /> : 'Yes, Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
