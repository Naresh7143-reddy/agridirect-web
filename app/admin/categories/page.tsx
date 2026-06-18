'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ToggleLeft, ToggleRight, Loader2, Trash2, ImageIcon } from 'lucide-react';
import client from '@/lib/api';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  isActive: boolean;
}

export default function AdminCategories() {
  const [cats, setCats]       = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName]       = useState('');
  const [adding, setAdding]   = useState(false);
  const [actionId, setAction] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.get('/api/categories');
      setCats(res.data?.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await client.post('/api/admin/categories', { name: name.trim() });
      const newCat = res.data?.data;
      if (newCat) setCats(prev => [newCat, ...prev]);
      setName('');
    } catch {}
    finally { setAdding(false); }
  };

  const toggleActive = async (cat: Category) => {
    setAction(cat.id);
    try {
      await client.put(`/api/admin/categories/${cat.id}/toggle`);
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch {}
    finally { setAction(null); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products in it will be unaffected.')) return;
    setAction(id);
    try {
      await client.delete(`/api/admin/categories/${id}`);
      setCats(prev => prev.filter(c => c.id !== id));
    } catch {}
    finally { setAction(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Categories</h1>
        <p className="text-ink-2 mt-1">{cats.length} categories · {cats.filter(c => c.isActive).length} active</p>
      </div>

      {/* Add form */}
      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1">New category name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="e.g. Leafy Vegetables"
            className="input w-full"
          />
        </div>
        <button
          onClick={addCategory}
          disabled={adding || !name.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {cats.map(cat => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`card flex items-center gap-4 transition ${!cat.isActive ? 'opacity-50' : ''}`}
              >
                {/* Image */}
                <div className="size-14 rounded-xl bg-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <ImageIcon className="size-6 text-ink-3" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{cat.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(cat)}
                    disabled={actionId === cat.id}
                    className="p-1.5 rounded-lg hover:bg-bg transition"
                    title={cat.isActive ? 'Disable' : 'Enable'}
                  >
                    {actionId === cat.id
                      ? <Loader2 className="size-5 animate-spin text-ink-2" />
                      : cat.isActive
                        ? <ToggleRight className="size-5 text-success" />
                        : <ToggleLeft className="size-5 text-ink-3" />}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    disabled={actionId === cat.id}
                    className="p-1.5 rounded-lg hover:bg-error/10 text-error transition"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
