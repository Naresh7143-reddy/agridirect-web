'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, Package, ShoppingBag, Sparkles, User, LogOut } from 'lucide-react';

const TABS = [
  { href: '/farmer',           label: 'Dashboard', icon: Home },
  { href: '/farmer/products',  label: 'Products',  icon: Package },
  { href: '/farmer/orders',    label: 'Orders',    icon: ShoppingBag },
  { href: '/farmer/ai',        label: 'Krishi AI', icon: Sparkles },
  { href: '/farmer/profile',   label: 'Profile',   icon: User },
];

export default function FarmerNav() {
  const router = useRouter();
  const pathname = usePathname();
  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    router.push('/');
  };
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 border-b border-border">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/farmer" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="text-xl font-extrabold text-primary tracking-tight">AgriDirect</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${active ? 'bg-primary text-white' : 'text-ink-1 hover:bg-bg'}`}>
                <t.icon className="size-4" /> {t.label}
              </Link>
            );
          })}
        </div>
        <button onClick={logout} className="p-2 rounded-full hover:bg-bg" aria-label="Logout"><LogOut className="size-5 text-ink-2" /></button>
      </div>
    </nav>
  );
}
