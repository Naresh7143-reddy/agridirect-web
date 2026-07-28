'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Heart, Plus, Minus, ShoppingCart, Star, Leaf, MapPin, CalendarDays, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { productsApi, wishlistApi, subscriptionsApi, reviewsApi } from '@/lib/api';
import { useCart, useWishlist } from '@/lib/store';
import { formatINR, productImageUrl } from '@/lib/utils';
import Cookies from 'js-cookie';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [mounted, setMounted] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  
  const add = useCart((s) => s.add);
  const wishlistItems = useWishlist((s) => s.items);
  const addWishlist = useWishlist((s) => s.add);
  const removeWishlist = useWishlist((s) => s.remove);

  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [subFrequency, setSubFrequency] = useState('WEEKLY');
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      productsApi.get(id).then((r) => r.data),
      reviewsApi.getProductReviews(id).then((r) => r.data ?? r).catch(() => [])
    ]).then(([pData, rData]) => {
      setProduct(pData);
      setReviews(rData);
    }).finally(() => setLoading(false));
  }, [id]);

  const isBuyer = mounted && Cookies.get('user_role') === 'BUYER';

  const handleSubscribe = async () => {
    if (!isBuyer) {
      toast.error('Please login as a buyer to subscribe');
      return;
    }
    setSubmittingSub(true);
    try {
      await subscriptionsApi.create({ 
        productId: product.id, 
        farmerId: product.farmerId || product.farmer?.id, 
        frequency: subFrequency,
        quantity: qty,
        deliveryAddress: "Default User Address" // Placeholder for now
      });
      setSubSuccess(true);
      toast.success('Successfully subscribed!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e.message ?? 'Failed to subscribe');
    } finally {
      setSubmittingSub(false);
    }
  };

  if (loading) return <div className="text-center py-20"><div className="text-4xl">⏳</div></div>;
  if (!product) return <div className="text-center py-20 text-ink-2">Product not found.</div>;

  const img = productImageUrl(product);
  const isWishlisted = mounted && wishlistItems.has(product.id);

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      unit: product.unit || 'kg',
      image: img,
      farmerName: product.farmerName,
    }, qty);
    toast.success(`Added ${qty} ${product.unit} of ${product.name}`);
  };

  const handleWishlist = async () => {
    if (!isBuyer) {
      toast.error('Please login as a buyer to save items');
      return;
    }
    
    try {
      if (isWishlisted) {
        removeWishlist(product.id);
        await wishlistApi.remove(product.id);
        toast.success('Removed from wishlist');
      } else {
        addWishlist(product.id);
        await wishlistApi.add(product.id);
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
      if (isWishlisted) addWishlist(product.id);
      else removeWishlist(product.id);
    }
  };

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-ink-2 hover:text-primary mb-6">
        <ArrowLeft className="size-5" /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-square rounded-3xl bg-gradient-to-br from-green-100 to-yellow-100 overflow-hidden relative"
        >
          {img ? (
            <Image src={img} alt={product.name} fill className="object-cover" priority />
          ) : (
            <div className="flex items-center justify-center h-full text-9xl">🥬</div>
          )}
          {product.isOrganic && (
            <span className="absolute top-5 left-5 bg-success text-white text-sm font-bold rounded-full px-3 py-1.5 flex items-center gap-2">
              <Leaf className="size-4" /> Organic certified
            </span>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-extrabold">{product.name}</h1>
            {isBuyer && (
              <button
                onClick={handleWishlist}
                className="p-3 rounded-full hover:bg-bg transition text-error shrink-0"
                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`size-7 ${isWishlisted ? 'fill-error' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => {
                const rating = product.averageRating ?? 5.0;
                return (
                  <Star 
                    key={i} 
                    className={`size-4 ${i < Math.round(rating) ? 'fill-secondary text-secondary' : 'text-ink-3'}`} 
                  />
                );
              })}
            </div>
            <span className="text-sm text-ink-2">
              {(product.averageRating ?? 5.0).toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-primary">{formatINR(product.price)}</span>
            <span className="text-xl text-ink-2">/ {product.unit}</span>
          </div>

          {product.description && (
            <p className="mt-6 text-ink-2 leading-relaxed">{product.description}</p>
          )}

          {/* Farmer card */}
          <Link href={`/buyer/farmer/${product.farmerId || product.farmer?.id}`} className="mt-8 p-5 rounded-2xl bg-bg flex items-center gap-4 hover:bg-border/40 transition block">
            <div className="size-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-extrabold">
              {(product.farmerName ?? 'F').charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink-1 hover:text-primary transition">{product.farmerName ?? 'Verified Farmer'}</div>
              <div className="text-sm text-ink-2 flex items-center gap-1">
                <MapPin className="size-3" /> {product.farmerLocation ?? 'India'}
              </div>
            </div>
          </Link>

          {/* Quantity + Add + Subscribe */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white rounded-full border-2 border-border px-2 py-2">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-9 rounded-full bg-bg hover:bg-border flex items-center justify-center">
                  <Minus className="size-4" />
                </button>
                <span className="font-bold w-8 text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="size-9 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition">
                  <Plus className="size-4" />
                </button>
              </div>
              <button onClick={handleAdd} className="btn-primary flex-1 text-lg py-4">
                <ShoppingCart className="size-5" /> Add to cart
              </button>
            </div>
            
            <button onClick={() => setShowSubscribeDialog(true)} className="btn-secondary w-full text-lg py-4 border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
              <CalendarDays className="size-5 mr-2" /> Subscribe & Save
            </button>
          </div>
        </motion.div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-border pt-10">
        <h2 className="text-2xl font-extrabold mb-6">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-ink-2 text-sm italic">No reviews yet for this product. Be the first to purchase and rate it!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((r: any) => (
              <div key={r.id} className="card bg-bg border-0 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.buyerName || 'Verified Buyer'}</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`size-3.5 ${i < r.rating ? 'fill-secondary text-secondary' : 'text-ink-3'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-ink-2">{r.review || r.comment || 'No comment provided.'}</p>
                <span className="text-xs text-ink-3 block">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe Dialog */}
      {showSubscribeDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !subSuccess && setShowSubscribeDialog(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
          >
            {subSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="size-16 text-success mx-auto mb-4" />
                <h2 className="text-xl font-bold text-success mb-2">Subscribed!</h2>
                <p className="text-ink-2 text-sm mb-6">Your regular deliveries have been scheduled.</p>
                <button onClick={() => { setShowSubscribeDialog(false); setSubSuccess(false); }} className="btn-primary w-full">Done</button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <CalendarDays className="size-6 text-primary" /> Subscribe
                  </h2>
                  <p className="text-ink-2 mt-2 text-sm">Get {product.name} delivered automatically.</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {['WEEKLY', 'BI_WEEKLY', 'MONTHLY'].map(freq => (
                    <button 
                      key={freq}
                      onClick={() => setSubFrequency(freq)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition ${subFrequency === freq ? 'border-primary bg-primary/5 font-bold' : 'border-border bg-white text-ink-2 hover:border-primary/30'}`}
                    >
                      {freq.replace('_', '-')} Delivery
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowSubscribeDialog(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSubscribe} disabled={submittingSub} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-50">
                    {submittingSub ? <Loader2 className="size-5 animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
