'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { getFirebaseAuth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { authApi, saveAuthCookies } from '@/lib/api';

declare global {
  interface Window { recaptchaVerifier?: any; confirmationResult?: any; }
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  useEffect(() => {
    // Already have tokens → go directly to the right dashboard
    const role = Cookies.get('user_role');
    const token = Cookies.get('access_token') || Cookies.get('refresh_token');
    if (role && token) {
      const home = role === 'FARMER' ? '/farmer' : role === 'DELIVERY' ? '/delivery' : '/buyer';
      router.replace(home);
    }
  }, []);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaContainer = useRef<HTMLDivElement>(null);

  const setupRecaptcha = () => {
    const auth = getFirebaseAuth();
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = undefined;
    }
    if (recaptchaContainer.current) {
      recaptchaContainer.current.innerHTML = '';
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer.current, {
        size: 'invisible',
      });
    }
    return window.recaptchaVerifier;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setupRecaptcha();
    } catch (e) {
      console.warn('Firebase not configured yet');
    }
  }, []);

  const sendOTP = async () => {
    if (phone.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const verifier = window.recaptchaVerifier ?? setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier!);
      window.confirmationResult = result;
      toast.success('OTP sent! Check your messages.');
      setStep('otp');
    } catch (e: any) {
      console.error('sendOTP failed:', e);
      toast.error(e?.code ? `${e.code}: ${e.message}` : (e?.message ?? 'Could not send OTP'));
      // reCAPTCHA tokens are single-use — rebuild it so the next attempt works
      try { setupRecaptcha(); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const confirmation = window.confirmationResult;
      const userCred = await confirmation.confirm(otp);
      const idToken = await userCred.user.getIdToken();

      // Try login against backend
      try {
        const res = await authApi.loginWithIdToken(idToken);
        const tokens = res.data?.tokens;
        const role = res.data?.user?.role;
        if (tokens?.accessToken) {
          saveAuthCookies(tokens, role || 'BUYER');
        }
        toast.success(`Welcome back!`);
        const home = role === 'FARMER' ? '/farmer' : role === 'DELIVERY' ? '/delivery' : '/buyer';
        router.push(home);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? '';
        if (/user not found|register first/i.test(msg)) {
          // New user — redirect to role-select with the idToken
          sessionStorage.setItem('idToken', idToken);
          sessionStorage.setItem('phone', phone);
          router.push('/register');
        } else {
          toast.error(msg || 'Login failed');
        }
      }
    } catch (e: any) {
      console.error('verifyOTP failed:', e);
      if (e?.code === 'auth/code-expired') {
        toast.error('OTP expired — please request a new one');
        setStep('phone');
        setOtp('');
        try { setupRecaptcha(); } catch {}
      } else {
        toast.error(e?.code ? `${e.code}: ${e.message}` : (e?.message ?? 'Invalid OTP'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-bg to-yellow-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-hover p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-3xl font-extrabold tracking-tight">AgriDirect</h1>
          <p className="text-ink-2 mt-2">
            {step === 'phone' ? 'Sign in with your phone number' : `Code sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <>
            <label className="block text-sm font-semibold text-ink-1 mb-2">Phone number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center rounded-2xl border-2 border-border bg-bg px-4 font-semibold">
                🇮🇳 +91
              </div>
              <div className="flex-1 flex items-center rounded-2xl border-2 border-border focus-within:border-primary bg-white px-4">
                <Phone className="size-4 text-ink-3 mr-2" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 py-3 bg-transparent outline-none"
                  data-testid="phone-input"
                />
              </div>
            </div>
            <button
              onClick={sendOTP}
              disabled={loading || phone.length !== 10}
              className="btn-primary w-full mt-6"
              data-testid="send-otp-btn"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <>Send OTP <ArrowRight className="size-5" /></>}
            </button>
            <p className="text-xs text-ink-3 text-center mt-6">
              Use Firebase test number <span className="font-mono">8919012622</span> + code{' '}
              <span className="font-mono">123456</span> to try without real SMS.
            </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold text-ink-1 mb-2">Enter 6-digit OTP</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-2xl border-2 border-border focus:border-primary bg-white px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] outline-none"
              autoFocus
              data-testid="otp-input"
            />
            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full mt-6"
              data-testid="verify-otp-btn"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : 'Verify & continue'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); }}
              className="w-full text-center text-sm text-ink-2 hover:text-primary mt-4"
            >
              ← Use a different number
            </button>
          </>
        )}

        <div ref={recaptchaContainer} />
      </motion.div>
    </main>
  );
}
