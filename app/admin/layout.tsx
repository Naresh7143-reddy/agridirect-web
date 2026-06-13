'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, LayoutDashboard, Users, Package, ShoppingBag, BarChart3, Bell } from 'lucide-react';

const SIDEBAR = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/categories', label: 'Categories', icon: Package },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-extrabold text-primary">AgriDirect</span>
          </Link>
          <div className="mt-1 text-xs font-bold bg-error/10 text-error rounded-full px-2 py-0.5 inline-block">ADMIN</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR.map((s) => {
            const active = pathname === s.href;
            return (
              <Link key={s.href} href={s.href} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 font-semibold transition ${active ? 'bg-primary text-white' : 'text-ink-1 hover:bg-bg'}`}>
                <s.icon className="size-5" /> {s.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={logout} className="flex items-center gap-3 w-full rounded-xl px-4 py-2.5 font-semibold text-error hover:bg-error/5">
            <LogOut className="size-5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden bg-white border-b border-border p-4 flex justify-between items-center">
          <Link href="/admin" className="font-extrabold text-primary">🌾 AgriDirect Admin</Link>
          <button onClick={logout} className="p-2"><LogOut className="size-5 text-error" /></button>
        </div>
        <div className="p-6 sm:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
