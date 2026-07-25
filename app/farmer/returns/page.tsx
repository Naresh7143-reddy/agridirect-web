'use client';

import { useState, useEffect } from 'react';
import { farmerApi } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '@/lib/utils';
import { motion } from 'framer-motion';
import FarmerNav from '@/components/common/FarmerNav';

export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/returns/farmer', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReturns(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    // In a real app, you would hit an endpoint like PUT /api/returns/{id}/{action}
    toast.success(`Return ${action}d!`);
    fetchReturns(); // Refresh list
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <FarmerNav />
      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-1">Returns Management</h1>
          <p className="text-ink-2 mt-2">Approve or reject return and refund requests from buyers.</p>
        </div>

        {returns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-border">
            <CheckCircle className="size-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold">All caught up!</h2>
            <p className="text-ink-2 mt-2">You have no pending return requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {returns.map((req, index) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card border-2 border-border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-ink-3 mb-1">
                    <span className="font-mono bg-border/50 px-2 py-0.5 rounded text-ink-2">Order {req.orderId?.slice(0,8).toUpperCase()}</span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink-1 mb-2 flex items-center gap-2">
                    <AlertCircle className="size-5 text-error" /> Refund Request: {formatINR(req.refundAmount)}
                  </h3>
                  <div className="bg-error/5 border border-error/20 p-3 rounded-xl text-sm text-ink-2">
                    <span className="font-semibold">Reason:</span> "{req.reason}"
                  </div>
                </div>

                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  <button onClick={() => handleAction(req.id, 'reject')} className="btn-secondary flex-1 text-error hover:bg-error/10">
                    <XCircle className="size-4 mr-2 inline" /> Reject
                  </button>
                  <button onClick={() => handleAction(req.id, 'approve')} className="btn-primary flex-1 bg-success hover:bg-success hover:brightness-95 text-white">
                    <CheckCircle className="size-4 mr-2 inline" /> Approve Refund
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
