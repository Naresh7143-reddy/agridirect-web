'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Leaf, Heart } from 'lucide-react';
import { useCart, useWishlist } from '@/lib/store';
import { formatINR, productImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { wishlistApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const [mounted, setMounted] = useState(false);
  const add = useCart((s) => s.add);
  const wishlistItems = useWishlist((s) => s.items);
  const addWishlist = useWishlist((s) => s.add);
  const removeWishlist = useWishlist((s) => s.remove);
  
  const isWishlisted = mounted && wishlistItems.has(product.id);
  const isBuyer = mounted && Cookies.get('user_role') === 'BUYER';
  
  useEffect(() => setMounted(true), []);

  const img = productImageUrl(product);
  
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      unit: product.unit || 'kg',
      image: img,
      farmerName: product.farmerName,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      // Revert optimistic update
      if (isWishlisted) addWishlist(product.id);
      else removeWishlist(product.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/buyer/product/${product.id}`}
        className="group block rounded-2xl bg-white shadow-card hover:shadow-hover hover:-translate-y-1 transition overflow-hidden relative"
      >
        <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-yellow-100 relative overflow-hidden">
          {img ? (
            <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 50vw, 25vw" />
          ) : (
            <div className="flex items-center justify-center h-full text-6xl opacity-30">🥬</div>
          )}
          {product.isOrganic && (
            <span className="absolute top-3 left-3 bg-success text-white text-xs font-bold rounded-full px-2 py-1 flex items-center gap-1">
              <Leaf className="size-3" /> Organic
            </span>
          )}
        </div>
        
        {/* Wishlist Button */}
        {isBuyer && (
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-full text-error transition shadow-sm z-10"
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={`size-4 ${isWishlisted ? 'fill-error' : ''}`} />
          </button>
        )}

        <div className="p-4">
          <h3 className="font-semibold text-ink-1 truncate">{product.name}</h3>
          <p className="text-xs text-ink-3 truncate mt-0.5">by {product.farmerName ?? 'Farmer'}</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-lg font-extrabold text-primary">
                {formatINR(product.price)}
                <span className="text-xs font-medium text-ink-3 ml-1">/{product.unit}</span>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="size-9 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition shadow-sm"
              aria-label="Add to cart"
              data-testid="add-to-cart-btn"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
