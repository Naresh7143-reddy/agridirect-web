'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, MapPin, Package, Bell, HelpCircle, FileText, Shield, LogOut, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';

const MENU = [
  { icon: Package,    label: 'My orders',          href: '/buyer/orders' },
  { icon: MapPin,     label: 'Saved addresses',    href: '/buyer/addresses' },
  { icon: Bell,       label: 'Notifications',      href: '/buyer/notifications' },
  { icon: HelpCircle, label: 'Help & support',     href: '/buyer/help' },
  { icon: FileText,   label: 'Terms & conditions', href: 'https://agridirect-backend-80yz.onrender.com/api/terms', external: true },
  { icon: Shield,     label: 'Privacy policy',     href: 'https://agridirect-backend-80yz.onrender.com/api/privacy', external: true },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    client.get('/api/auth/me')
      .then((r) => setUser(r.data?.data ?? null))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    toast.success('Signed out');
    router.push('/');
  };

  const rawName = user?.name || 'U';
  const initials = rawName.split(' ').slice(0, 2).map((p: string) => (p[0] ?? '').toUpperCase()).filter(Boolean).join('') || '?';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="card text-center">
        <div className="size-24 mx-auto rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold mb-4">
          {initials}
        </div>
        <h1 className="text-2xl font-extrabold">{user?.name ?? 'AgriDirect User'}</h1>
        {user?.phone && <p className="text-ink-2 mt-1">+91 {user.phone.replace(/^\+91/, '')}</p>}
        <div className="mt-3 inline-block bg-primary/10 text-primary text-xs font-bold rounded-full px-3 py-1">
          {user?.role ?? 'BUYER'}
        </div>
      </div>

      {/* Menu */}
      <div className="card !p-0 overflow-hidden">
        {MENU.map((m, i) =>
          m.external ? (
            <a
              key={i}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-bg transition"
            >
              <div className="size-10 rounded-xl bg-bg flex items-center justify-center"><m.icon className="size-5 text-primary" /></div>
              <span className="flex-1 font-semibold">{m.label}</span>
              <ChevronRight className="size-5 text-ink-3" />
            </a>
          ) : (
            <Link
              key={i}
              href={m.href}
              className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-bg transition"
            >
              <div className="size-10 rounded-xl bg-bg flex items-center justify-center"><m.icon className="size-5 text-primary" /></div>
              <span className="flex-1 font-semibold">{m.label}</span>
              <ChevronRight className="size-5 text-ink-3" />
            </Link>
          ),
        )}
      </div>

      <button onClick={logout} className="w-full card flex items-center justify-center gap-2 text-error font-bold hover:bg-error/5">
        <LogOut className="size-5" /> Sign out
      </button>

      <p className="text-center text-xs text-ink-3">AgriDirect v1.0.0 · Built by Godi Naresh Reddy</p>
    </div>
  );
}
