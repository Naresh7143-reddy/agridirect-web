'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';
import { formatINR, productImageUrl } from '@/lib/utils';

export default function FarmerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/api/farmer/products')
      .then((r) => setProducts(r.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">My products</h1>
          <p className="text-ink-2 mt-1">{products.length} listings</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="size-5" /> Add product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 card">
          <Package className="size-16 text-ink-3 mx-auto mb-4" />
          <h2 className="font-bold text-xl">No products yet</h2>
          <p className="text-ink-2 mt-2 mb-6">Add your first listing to start selling.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">+ Add product</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card !p-0 overflow-hidden">
              <div className="aspect-[4/3] bg-bg relative">
                {productImageUrl(p) ? (
                  <Image src={productImageUrl(p)} alt={p.name} fill className="object-cover" sizes="200px" />
                ) : <div className="flex items-center justify-center h-full text-5xl">🥬</div>}
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-primary font-extrabold">{formatINR(p.price)}<span className="text-xs text-ink-3 font-medium">/{p.unit}</span></div>
                  <div className="text-xs bg-bg rounded-full px-2 py-1">Stock {p.stockQuantity ?? 0}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/api/categories').then((r) => setCategories(r.data?.data ?? []));
  }, []);

  const submit = async () => {
    if (!name.trim() || !price || !categoryId) {
      toast.error('Fill name, price and category');
      return;
    }
    setBusy(true);
    try {
      await client.post('/api/farmer/products', {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        unit,
        stock: parseInt(stock, 10),
        minOrderQuantity: 1,
        categoryId,
      });
      toast.success('Product added!');
      onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to add product');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-extrabold mb-6">Add product</h2>
        <div className="space-y-3">
          <Input label="Name *" value={name} onChange={setName} placeholder="e.g. Fresh Tomatoes" />
          <div>
            <label className="block text-sm font-semibold mb-2">Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹) *" value={price} onChange={setPrice} placeholder="40" type="number" />
            <div>
              <label className="block text-sm font-semibold mb-2">Unit *</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none">
                {['kg', 'piece', 'litre', 'bunch', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Stock" value={stock} onChange={setStock} placeholder="10" type="number" />
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell buyers about your produce" rows={3} className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary flex-1">{busy ? <Loader2 className="size-5 animate-spin" /> : 'Add product'}</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input type={type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none" />
    </div>
  );
}
