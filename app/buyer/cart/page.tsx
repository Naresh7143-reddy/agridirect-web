'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { toast } from 'sonner';
import { calcDeliveryFee, estimatedDelivery, PLATFORM_FEE } from '@/lib/delivery';

export default function CartPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const delivery = calcDeliveryFee(total);
  const grand = total + delivery + PLATFORM_FEE;
  const eta = estimatedDelivery();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="size-20 text-ink-3 mx-auto mb-6" />
        <h1 className="text-3xl font-extrabold mb-2">Your cart is empty</h1>
        <p className="text-ink-2 mb-8">Start adding fresh produce!</p>
        <Link href="/buyer/browse" className="btn-primary">Browse products <ArrowRight className="size-5" /></Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">Your cart ({items.length})</h1>
          <button onClick={clear} className="text-sm text-ink-2 hover:text-error" data-testid="cart-clear-btn">Clear all</button>
        </div>

        {items.map((item, i) => (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex items-center gap-4"
          data-testid="cart-item"
          >
            <div className="size-20 rounded-xl bg-bg overflow-hidden relative flex-shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
              ) : <div className="flex items-center justify-center h-full text-3xl">🥬</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{item.name}</h3>
              <p className="text-sm text-ink-2 truncate">{item.farmerName}</p>
              <div className="text-primary font-extrabold mt-1">
                {formatINR(item.price)}<span className="text-xs text-ink-3 font-medium">/{item.unit}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-bg rounded-full px-1.5 py-1.5">
              <button onClick={() => setQuantity(item.productId, item.quantity - 1)} className="size-7 rounded-full bg-white hover:bg-border flex items-center justify-center" data-testid="qty-decrease">
                <Minus className="size-3" />
              </button>
              <span className="font-bold w-6 text-center text-sm" data-testid="qty-value">{item.quantity}</span>
              <button onClick={() => setQuantity(item.productId, item.quantity + 1)} className="size-7 rounded-full bg-primary text-white flex items-center justify-center" data-testid="qty-increase">
                <Plus className="size-3" />
              </button>
            </div>
            <button onClick={() => { remove(item.productId); toast.success('Removed'); }} className="p-2 text-ink-3 hover:text-error transition" data-testid="remove-item">
              <Trash2 className="size-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <div className="card space-y-3">
          <h2 className="font-extrabold text-xl mb-2">Order summary</h2>
          <Row label="Subtotal" value={formatINR(total)} />
          <Row label="Delivery" value={delivery === 0 ? 'FREE' : formatINR(delivery)} />
          <Row label="Platform fee" value={formatINR(PLATFORM_FEE)} />
          {delivery > 0 && total < 500 && (
            <div className="bg-secondary/10 text-ink-1 rounded-xl p-3 text-sm">
              Add <strong>{formatINR(500 - total)}</strong> more for free delivery 🚚
            </div>
          )}
          <div className="flex justify-between text-ink-2 text-sm">
            <span>Estimated delivery</span>
            <span className="font-semibold text-ink-1">{eta}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-baseline">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-extrabold text-primary">{formatINR(grand)}</span>
          </div>
          <button onClick={() => router.push('/buyer/checkout')} className="btn-primary w-full text-base py-4 mt-3" data-testid="checkout-btn">
            Proceed to checkout <ArrowRight className="size-5" />
          </button>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-2">
      <span>{label}</span>
      <span className="font-semibold text-ink-1">{value}</span>
    </div>
  );
}
