'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { returnsApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function BuyerReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await returnsApi.listBuyer();
      setReturns(res.data ?? res);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-bg rounded-full transition">
          <ArrowLeft className="size-5 text-ink-2" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold">My Returns</h1>
          <p className="text-ink-2 mt-1">Track and manage your product return requests</p>
        </div>
        <button onClick={load} className="btn-secondary ml-auto flex items-center gap-2">
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : returns.length === 0 ? (
        <div className="card text-center py-16 text-ink-2 max-w-md mx-auto">
          <FileText className="size-12 mx-auto mb-3 text-ink-3" />
          <p className="font-semibold text-lg">No returns requested</p>
          <p className="text-sm mt-1">When you request a return on an order, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {returns.map((ret) => (
              <motion.div
                key={ret.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg">Return #{ret.id.slice(0, 8)}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      ret.status === 'APPROVED' ? 'bg-success/15 text-success' :
                      ret.status === 'REJECTED' ? 'bg-error/15 text-error' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ret.status || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-2">Reason: <span className="font-semibold text-ink-1">{ret.reason}</span></p>
                  {ret.comment && <p className="text-sm text-ink-2 italic">"{ret.comment}"</p>}
                </div>
                <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-xs text-ink-3">Requested on</div>
                  <div className="font-medium text-sm">
                    {ret.createdAt ? new Date(ret.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
