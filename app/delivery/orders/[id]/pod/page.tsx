'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
      toast.error('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      await deliveryApi.verifyOtp(orderId, otp);
      setSuccess(true);
      toast.success('Delivery Verified Successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-8 mt-10 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto" />
        </motion.div>
        <h1 className="text-2xl font-bold text-green-600">Order Delivered!</h1>
        <p className="text-ink-2">The OTP was verified successfully.</p>
        <button onClick={() => router.push('/delivery')} className="btn-primary w-full">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center text-ink-2 hover:text-primary transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Order
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h1 className="text-2xl font-bold mb-2">Proof of Delivery</h1>
        <p className="text-ink-2 mb-6">Ask the buyer for their 6-digit Delivery OTP.</p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-2 mb-2">Delivery OTP</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder="••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.length !== 6}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying...' : 'Verify & Complete Delivery'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
