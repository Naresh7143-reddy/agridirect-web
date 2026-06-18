'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Wheat, Bike, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { authApi, saveAuthCookies } from '@/lib/api';

type Role = 'BUYER' | 'FARMER' | 'DELIVERY';

const ROLES: { key: Role; icon: any; title: string; desc: string; color: string }[] = [
  { key: 'BUYER',    icon: ShoppingCart, title: 'Buyer',         desc: 'I want to buy fresh produce',          color: 'from-primary to-primary-dark' },
  { key: 'FARMER',   icon: Wheat,        title: 'Farmer',        desc: 'I want to sell my produce',            color: 'from-secondary to-yellow-600' },
  { key: 'DELIVERY', icon: Bike,         title: 'Delivery Partner', desc: 'I want to deliver orders',          color: 'from-blue-500 to-blue-700' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem('idToken');
    if (!t) {
      toast.error('Session expired, please log in again');
      router.push('/login');
      return;
    }
    setIdToken(t);
  }, [router]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!idToken || !role) return;
    setLoading(true);
    try {
      const payload: any = { name: name.trim(), idToken, role };
      if (role === 'FARMER') {
        payload.farmName = farmName.trim() || undefined;
        payload.location = location.trim() || undefined;
      }
      const res = await authApi.register(payload);
      const tokens = res.data?.tokens;
      const userRole = res.data?.user?.role;
      if (tokens?.accessToken) {
        saveAuthCookies(tokens, userRole || role);
      }
      sessionStorage.removeItem('idToken');
      toast.success('Welcome to AgriDirect!');
      const home = role === 'FARMER' ? '/farmer' : role === 'DELIVERY' ? '/delivery' : '/buyer';
      router.push(home);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '';
      // Recovery: if backend says already registered, sign them in directly
      if (/already registered|already exists|conflict/i.test(msg)) {
        try {
          const res = await authApi.loginWithIdToken(idToken);
          const tokens = res.data?.tokens;
          const userRole = res.data?.user?.role;
          if (tokens?.accessToken) {
            saveAuthCookies(tokens, userRole || 'BUYER');
          }
          const home = userRole === 'FARMER' ? '/farmer' : userRole === 'DELIVERY' ? '/delivery' : '/buyer';
          router.push(home);
          return;
        } catch (e2: any) {
          toast.error(e2?.response?.data?.message ?? 'Login failed');
        }
      } else {
        toast.error(msg || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-bg to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-10">
            <div className="text-5xl mb-3">🌾</div>
            <h1 className="text-4xl font-extrabold">Welcome to AgriDirect!</h1>
            <p className="text-ink-2 mt-3 text-lg">Pick your role to continue</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r, i) => (
              <motion.button
                key={r.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { setRole(r.key); setStep('form'); }}
                className="group text-left bg-white rounded-3xl p-8 shadow-card hover:shadow-hover hover:-translate-y-2 transition"
                data-testid={`role-${r.key}`}
              >
                <div className={`size-16 rounded-2xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-5`}>
                  <r.icon className="size-8" />
                </div>
                <h2 className="text-2xl font-extrabold mb-2">{r.title}</h2>
                <p className="text-ink-2">{r.desc}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                  Continue <ArrowRight className="size-4" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </main>
    );
  }

  const r = ROLES.find((x) => x.key === role)!;
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-bg to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-hover p-8 sm:p-10"
      >
        <button onClick={() => setStep('role')} className="text-sm text-ink-2 hover:text-primary mb-6">
          ← Change role
        </button>
        <div className={`size-14 rounded-2xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-5`}>
          <r.icon className="size-7" />
        </div>
        <h1 className="text-3xl font-extrabold">Sign up as {r.title}</h1>
        <p className="text-ink-2 mt-2">Tell us a bit about yourself</p>

        <div className="space-y-4 mt-8">
          <Field label="Full Name *" value={name} onChange={setName} placeholder="e.g. Ramesh Kumar" testId="name-input" />
          {role === 'FARMER' && (
            <>
              <Field label="Farm Name" value={farmName} onChange={setFarmName} placeholder="Optional" />
              <Field label="Farm Location" value={location} onChange={setLocation} placeholder="e.g. Giddalur, AP" />
            </>
          )}
        </div>

        <button onClick={submit} disabled={loading || !name.trim()} className="btn-primary w-full mt-8" data-testid="register-submit-btn">
          {loading ? <Loader2 className="size-5 animate-spin" /> : <>Create account <ArrowRight className="size-5" /></>}
        </button>
      </motion.div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, testId }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none"
        data-testid={testId}
      />
    </div>
  );
}
