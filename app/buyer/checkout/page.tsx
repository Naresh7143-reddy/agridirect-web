'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Loader2, ArrowRight, Wallet, Smartphone, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi } from '@/lib/api';
import { useCart } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { calcDeliveryFee, estimatedDelivery, PLATFORM_FEE } from '@/lib/delivery';

type PaymentMethod = 'COD' | 'UPI' | 'CARD';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [payment, setPayment] = useState<PaymentMethod>('COD');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/buyer/cart');
      return;
    }
    buyerApi.getAddresses()
      .then((r) => {
        const list = r.data || [];
        setAddresses(list);
        const def = list.find((a: any) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
        if (list.length === 0) setShowAddForm(true);
      })
      .catch(() => setShowAddForm(true))
      .finally(() => setLoading(false));
  }, [items.length, router]);

  const useGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported by your browser');
      return;
    }
    toast.info('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          const data = await r.json();
          const a = data.address || {};
          setNewAddr({
            label: 'Home',
            line1: [a.house_number, a.road || a.neighbourhood].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '',
            city: a.city || a.town || a.village || '',
            state: a.state || '',
            pincode: a.postcode || '',
          });
          toast.success('Location filled');
        } catch {
          toast.error('Reverse geocoding failed — please type manually');
        }
      },
      (err) => toast.error(err.message || 'Could not get location'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const saveAddress = async () => {
    if (!newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
      toast.error('Fill all required fields');
      return;
    }
    try {
      const r = await buyerApi.addAddress({ ...newAddr, setAsDefault: addresses.length === 0 });
      const saved = r.data;
      setAddresses((a) => [...a, saved]);
      setSelectedAddressId(saved.id);
      setShowAddForm(false);
      toast.success('Address saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not save address');
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    setPlacing(true);
    try {
      await buyerApi.placeOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number.isFinite(i.quantity) && i.quantity > 0 ? i.quantity : 1,
          pricePerUnit: Number.isFinite(i.price) ? i.price : 0,
          unit: i.unit || 'kg',
        })),
        addressId: selectedAddressId,
        paymentMethod: payment,
        deliveryFee: delivery,
        platformFee: PLATFORM_FEE,
      });
      clear();
      toast.success('Order placed! 🎉');
      router.push('/buyer/orders');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Order failed — please try again');
    } finally {
      setPlacing(false);
    }
  };

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  const delivery = calcDeliveryFee(total, selectedAddr?.pincode);
  const grand = total + delivery + PLATFORM_FEE;
  const eta = estimatedDelivery(selectedAddr?.pincode);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-extrabold">Checkout</h1>

        {/* Address */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><MapPin className="size-5 text-primary" /> Delivery address</h2>

          {addresses.length > 0 && !showAddForm && (
            <div className="space-y-2 mb-4">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAddressId(a.id)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition ${
                    selectedAddressId === a.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold">{a.label}</div>
                    {selectedAddressId === a.id && <Check className="size-5 text-primary" />}
                  </div>
                  <div className="text-sm text-ink-2 mt-1">{a.line1}, {a.city}, {a.state} — {a.pincode}</div>
                </button>
              ))}
            </div>
          )}

          {showAddForm ? (
            <div className="space-y-3">
              <button onClick={useGPS} className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary text-primary py-3 font-semibold hover:bg-primary/5">
                📍 Use my current location
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                {(['line1', 'city', 'state', 'pincode'] as const).map((k) => (
                  <input
                    key={k}
                    placeholder={k === 'line1' ? 'Address line *' : k[0].toUpperCase() + k.slice(1) + ' *'}
                    value={(newAddr as any)[k]}
                    onChange={(e) => setNewAddr({ ...newAddr, [k]: e.target.value })}
                    className={k === 'line1' ? 'sm:col-span-2 px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none' : 'px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none'}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveAddress} className="btn-primary flex-1">Save address</button>
                {addresses.length > 0 && (
                  <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                )}
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="text-sm font-semibold text-primary hover:underline">
              + Add new address
            </button>
          )}
        </section>

        {/* Payment */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Payment method</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              { key: 'COD', icon: Wallet, label: 'Cash on Delivery' },
              { key: 'UPI', icon: Smartphone, label: 'UPI' },
              { key: 'CARD', icon: CreditCard, label: 'Card' },
            ] as const).map((p) => (
              <button
                key={p.key}
                onClick={() => setPayment(p.key)}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition ${
                  payment === p.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <p.icon className="size-6 text-primary" />
                <span className="text-sm font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
          {payment !== 'COD' && (
            <p className="text-xs text-ink-3 mt-3">
              {payment === 'UPI' ? 'UPI checkout will open Razorpay (test mode).' : 'Card checkout uses Razorpay test mode.'}
            </p>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <div className="card">
          <h2 className="font-extrabold text-xl mb-4">Order summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between">
                <span className="truncate pr-2">{i.name} × {i.quantity}</span>
                <span className="font-semibold">{formatINR(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(total)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? 'FREE' : formatINR(delivery)}</span></div>
            <div className="flex justify-between"><span>Platform fee</span><span>{formatINR(PLATFORM_FEE)}</span></div>
            <div className="flex justify-between text-xs text-ink-3 -mt-1 mb-1">
              <span>flat ₹10 platform fee</span>
              <span></span>
            </div>
          </div>
          <div className="border-t border-border my-4" />
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-extrabold text-primary">{formatINR(grand)}</span>
          </div>
          {eta && (
            <div className="mt-3 flex items-center gap-2 text-sm bg-success/10 text-success rounded-xl px-3 py-2">
              <span>🚚</span>
              <span className="font-semibold">Estimated delivery: {eta}</span>
            </div>
          )}
          <button
            onClick={placeOrder}
            disabled={placing || !selectedAddressId}
            className="btn-primary w-full text-base py-4 mt-4"
          >
            {placing ? <Loader2 className="size-5 animate-spin" /> : <>Place order <ArrowRight className="size-5" /></>}
          </button>
        </div>
      </aside>
    </div>
  );
}
