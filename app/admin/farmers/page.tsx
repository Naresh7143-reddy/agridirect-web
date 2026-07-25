'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, UserCheck, UserX, Wheat, MapPin, Phone, BadgeCheck, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

export default function AdminFarmers() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingFarmers();
      setFarmers(res.data ?? []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.verifyFarmer(id);
      setFarmers((prev) => prev.filter((f) => (f.userId ?? f.id) !== id));
      toast.success('Farmer verified!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    if (!confirm('Reject this farmer application?')) return;
    setActionId(id);
    try {
      await adminApi.rejectFarmer(id);
      setFarmers((prev) => prev.filter((f) => (f.userId ?? f.id) !== id));
      toast.success('Farmer rejected');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const filtered = farmers.filter((f) => {
    const q = query.toLowerCase();
    return !q || f.farmName?.toLowerCase().includes(q) || f.name?.toLowerCase().includes(q) || f.phone?.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Farmer Verification</h1>
          <p className="text-ink-2 mt-1">{farmers.length} pending application{farmers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {farmers.length > 3 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or farm…" className="input pl-9 w-full" />
        </div>
      )}

      {loading ? (
        <div className="card flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-ink-2">
          <BadgeCheck className="size-12 mx-auto mb-3 text-success" />
          <p className="font-semibold">All caught up!</p>
          <p className="text-sm mt-1">No pending farmer verifications.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((farmer) => {
              const id = farmer.userId ?? farmer.id;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center font-extrabold text-lg">
                      {(farmer.farmName || farmer.name || 'F')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{farmer.name || farmer.farmName || 'Unknown'}</h3>
                      <div className="text-xs text-ink-3 font-mono">ID: {String(id).slice(0, 8).toUpperCase()}</div>
                    </div>
                    <span className="text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">PENDING</span>
                  </div>

                  <div className="space-y-2">
                    {farmer.farmName && (
                      <div className="flex items-center gap-2 text-sm text-ink-2">
                        <Wheat className="size-3.5 shrink-0" /> {farmer.farmName}
                      </div>
                    )}
                    {farmer.phone && (
                      <div className="flex items-center gap-2 text-sm text-ink-2">
                        <Phone className="size-3.5 shrink-0" /> {farmer.phone}
                      </div>
                    )}
                    {(farmer.location || farmer.city || farmer.state) && (
                      <div className="flex items-center gap-2 text-sm text-ink-2">
                        <MapPin className="size-3.5 shrink-0" />
                        {typeof farmer.location === 'string'
                          ? farmer.location
                          : [farmer.location?.city || farmer.city, farmer.location?.state || farmer.state].filter(Boolean).join(', ') || 'Location provided'}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => verify(id)}
                      disabled={actionId === id}
                      className="flex-1 btn-primary flex items-center justify-center gap-1.5 py-2.5"
                    >
                      {actionId === id ? <Loader2 className="size-4 animate-spin" /> : <><UserCheck className="size-4" /> Verify</>}
                    </button>
                    <button
                      onClick={() => reject(id)}
                      disabled={actionId === id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-error text-error font-bold hover:bg-error/5 transition"
                    >
                      <UserX className="size-4" /> Reject
                    </button>
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
