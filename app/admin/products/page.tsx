'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, Package, Search, RefreshCw, ImageIcon, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { formatINR, productImageUrl } from '@/lib/utils';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingProducts();
      setProducts(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.approveProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product approved!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject this product listing?')) return;
    setActionId(id);
    try {
      await adminApi.rejectProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product rejected');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.farmerName?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Product Approvals</h1>
          <p className="text-ink-2 mt-1">{products.length} pending product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {products.length > 3 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product name or farmer…" className="input pl-9 w-full" />
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-ink-2">
          <Check className="size-12 mx-auto mb-3 text-success" />
          <p className="font-semibold">All caught up!</p>
          <p className="text-sm mt-1">No products pending review.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((product) => {
              const imgUrl = productImageUrl(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card !p-0 overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-bg relative overflow-hidden">
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="size-12 text-ink-3" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 shadow-sm">PENDING</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg truncate">{product.name}</h3>
                      {product.farmerName && (
                        <p className="text-xs text-ink-3 mt-0.5">by {product.farmerName}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-primary font-extrabold text-lg">
                        {formatINR(product.price ?? 0)}
                        <span className="text-xs text-ink-3 font-medium">/{product.unit ?? 'kg'}</span>
                      </div>
                      {product.stockQuantity != null && (
                        <span className="text-xs bg-bg rounded-full px-2 py-1 font-semibold">Stock: {product.stockQuantity}</span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-ink-2 line-clamp-2">{product.description}</p>
                    )}

                    {product.categoryName && (
                      <span className="inline-block text-xs font-bold bg-primary/10 text-primary rounded-full px-2 py-0.5">
                        {product.categoryName}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => approve(product.id)}
                        disabled={actionId === product.id}
                        className="flex-1 btn-primary flex items-center justify-center gap-1.5 py-2.5"
                      >
                        {actionId === product.id ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Approve</>}
                      </button>
                      <button
                        onClick={() => reject(product.id)}
                        disabled={actionId === product.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-error text-error font-bold hover:bg-error/5 transition"
                      >
                        <X className="size-4" /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
