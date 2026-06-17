'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Leaf } from 'lucide-react';
import { useCart } from '@/lib/store';
import { formatINR, productImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductCard({ product, index = 0 }: { product: any; index?: number }) {
  const add = useCart((s) => s.add);
  const img = productImageUrl(product);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={`/buyer/product/${product.id}`}
        className="group block rounded-2xl bg-white shadow-card hover:shadow-hover hover:-translate-y-1 transition overflow-hidden"
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
