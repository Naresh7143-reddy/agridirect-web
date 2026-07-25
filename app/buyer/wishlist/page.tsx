'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { wishlistApi } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    wishlistApi.list()
      .then((r) => setItems(r.data ?? []))
      .catch(() => toast.error('Failed to load wishlist'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistApi.remove(productId);
      setItems((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Removed from wishlist');
    } catch (e: any) {
      toast.error('Could not remove item');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 card">
        <Heart className="size-16 text-ink-3 mx-auto mb-4" />
        <h2 className="font-bold text-xl">Your wishlist is empty</h2>
        <p className="text-ink-2 mt-2 mb-6">Save items you like and they will show up here.</p>
        <Link href="/buyer/browse" className="btn-primary">Browse products <ArrowRight className="size-4" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <Heart className="size-8 text-primary fill-primary/10" /> Wishlist
        </h1>
        <span className="text-ink-2 font-semibold">{items.length} items</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {items.map((p, i) => (
          <div key={p.id} className="relative">
            <ProductCard product={p} index={i} />
            <button
              onClick={(e) => { e.preventDefault(); handleRemove(p.id); }}
              className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full text-error hover:scale-110 transition shadow-sm z-10"
              title="Remove from wishlist"
            >
              <Heart className="size-4 fill-error" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
