'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/store';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const count = useCart((s) => s.count());
  useEffect(() => setMounted(true), []);

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 border-b border-border">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/buyer" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="text-xl font-extrabold text-primary tracking-tight">AgriDirect</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/buyer">Home</NavLink>
          <NavLink href="/buyer/browse">Browse</NavLink>
          <NavLink href="/buyer/orders">Orders</NavLink>
          <NavLink href="/buyer/ai"><Sparkles className="size-4 inline mr-1" />AI Assist</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/buyer/cart" className="relative p-2 rounded-full hover:bg-bg transition">
            <ShoppingCart className="size-6" />
            {mounted && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-in">
                {count}
              </span>
            )}
          </Link>
          <Link href="/buyer/profile" className="p-2 rounded-full hover:bg-bg transition">
            <User className="size-6" />
          </Link>
          <button onClick={logout} className="p-2 rounded-full hover:bg-bg transition" aria-label="Logout">
            <LogOut className="size-5 text-ink-2" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold text-ink-1 hover:bg-bg transition"
    >
      {children}
    </Link>
  );
}
