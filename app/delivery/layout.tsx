'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut } from 'lucide-react';

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    router.push('/');
  };
  return (
    <div className="min-h-screen bg-bg">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 border-b border-border">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/delivery" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-extrabold text-primary tracking-tight">AgriDirect</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Delivery</span>
          </Link>
          <button onClick={logout} className="p-2 rounded-full hover:bg-bg"><LogOut className="size-5 text-ink-2" /></button>
        </div>
      </nav>
      <main className="container-x py-8">{children}</main>
    </div>
  );
}
