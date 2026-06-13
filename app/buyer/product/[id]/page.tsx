'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Leaf, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';
import { productsApi } from '@/lib/api';
import { useCart } from '@/lib/store';
import { formatINR, productImageUrl } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);

  useEffect(() => {
    productsApi.get(id).then((r) => setProduct(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20"><div className="text-4xl">⏳</div></div>;
  if (!product) return <div className="text-center py-20 text-ink-2">Product not found.</div>;

  const img = productImageUrl(product);

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
          <h1 className="text-4xl font-extrabold">{product.name}</h1>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-secondary text-secondary" />
              ))}
            </div>
            <span className="text-sm text-ink-2">
              {(product.averageRating ?? 4.5).toFixed(1)} · 142 reviews
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
          <div className="mt-8 p-5 rounded-2xl bg-bg flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-extrabold">
              {(product.farmerName ?? 'F').charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{product.farmerName ?? 'Verified Farmer'}</div>
              <div className="text-sm text-ink-2 flex items-center gap-1">
                <MapPin className="size-3" /> {product.farmerLocation ?? 'India'}
              </div>
            </div>
          </div>

          {/* Quantity + Add */}
          <div className="mt-8 flex items-center gap-4">
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
              <ShoppingCart className="size-5" /> Add to cart · {formatINR(product.price * qty)}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
