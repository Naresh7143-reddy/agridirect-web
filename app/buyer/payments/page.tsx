'use client';

import { useState, useEffect } from 'react';
import { Loader2, IndianRupee, FileText, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { formatINR } from '@/lib/utils';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  useEffect(() => {
    // Fetch all orders and use them as payment records
    buyerApi.getOrders()
      .then((res) => setPayments(res.data?.data ?? res.data ?? []))
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  const filteredPayments = payments.filter((p) => {
    if (filter === 'ALL') return true;
    return p.paymentStatus === filter;
  });

  const totalSpent = payments.filter(p => p.paymentStatus === 'PAID').reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <IndianRupee className="size-8 text-primary" /> Payment History
          </h1>
          <p className="text-ink-2 mt-1">Track your past transactions and invoices.</p>
        </div>
        <div className="bg-primary/10 text-primary px-5 py-3 rounded-2xl font-bold flex flex-col">
          <span className="text-xs uppercase tracking-wider opacity-80">Total Spent</span>
          <span className="text-2xl">{formatINR(totalSpent)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['ALL', 'PAID', 'PENDING'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition ${filter === f ? 'bg-primary text-white' : 'bg-white border-2 border-border text-ink-2 hover:border-primary/50'}`}
          >
            {f === 'ALL' ? 'All Transactions' : f}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="card space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-10 text-ink-3">No payments found.</div>
        ) : (
          filteredPayments.map((payment, i) => (
            <motion.div 
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 bg-bg rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${payment.paymentStatus === 'PAID' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                  {payment.paymentStatus === 'PAID' ? <CheckCircle2 className="size-6" /> : <Clock className="size-6" />}
                </div>
                <div>
                  <div className="font-bold text-ink-1">Order #{payment.id?.slice(0,8).toUpperCase()}</div>
                  <div className="text-sm text-ink-2">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : 'Unknown date'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-extrabold text-lg">{formatINR(payment.totalAmount)}</div>
                  <div className={`text-xs font-bold ${payment.paymentStatus === 'PAID' ? 'text-success' : 'text-warning'}`}>
                    {payment.paymentStatus || 'PENDING'}
                  </div>
                </div>
                <button className="hidden sm:flex p-2 hover:bg-border rounded-xl text-primary transition" title="Download Invoice">
                  <FileText className="size-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
