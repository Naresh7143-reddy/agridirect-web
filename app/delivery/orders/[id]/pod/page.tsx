'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ShieldCheck, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { deliveryApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ProofOfDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP provided by the buyer');
      return;
    }

    setLoading(true);
    try {
      await deliveryApi.verifyOtp(orderId, otp);
      setSuccess(true);
      toast.success('Delivery Verified & Completed!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'OTP Verification Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 md:p-8 mt-12 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
          <div className="size-24 rounded-full bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="size-14" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Order Delivered!</h1>
          <p className="text-slate-500 text-sm mt-1">OTP verified successfully. Earnings added to your balance.</p>
        </div>
        <button
          onClick={() => router.push('/delivery')}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition"
        >
          Return to Dispatch Console
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="size-4 mr-2" /> Back to Orders
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Proof of Delivery</h1>
            <p className="text-xs text-slate-500">Order #{orderId.slice(0, 8)}</p>
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Ask the buyer for their <strong className="text-emerald-600">6-digit Delivery OTP</strong> sent to their phone upon reaching the drop location.
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
              Enter 6-Digit Delivery OTP
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full py-4 text-center text-3xl tracking-[0.4em] font-mono font-black rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:outline-none transition shadow-inner"
              placeholder="••••••"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <KeyRound className="size-5" />
                <span>Verify OTP & Complete Delivery</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

