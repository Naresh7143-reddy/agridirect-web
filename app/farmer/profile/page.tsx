'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, Wheat, MapPin, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function FarmerProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    client.get('/api/auth/me').then((r) => setUser(r.data?.data ?? null)).catch(() => {});
    client.get('/api/farmer/profile').then((r) => setProfile(r.data?.data ?? null)).catch(() => {});
  }, []);

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_role');
    toast.success('Signed out');
    router.push('/');
  };

  const initials = (user?.name ?? 'F').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card text-center">
        <div className="size-24 mx-auto rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold mb-4">{initials}</div>
        <h1 className="text-2xl font-extrabold">{user?.name ?? 'Farmer'}</h1>
        {user?.phone && <p className="text-ink-2">+91 {user.phone.replace(/^\+91/, '')}</p>}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full px-3 py-1">
          <Wheat className="size-3" /> Farmer
          {profile?.verified && <BadgeCheck className="size-3 text-success ml-1" />}
        </div>
      </div>

      {profile && (
        <div className="card space-y-3">
          <h2 className="font-extrabold text-lg">Farm details</h2>
          <Info icon={Wheat} label="Farm name" value={profile.farmName ?? '—'} />
          <Info icon={MapPin} label="Location" value={profile.location ?? '—'} />
        </div>
      )}

      <button onClick={logout} className="w-full card flex items-center justify-center gap-2 text-error font-bold hover:bg-error/5">
        <LogOut className="size-5" /> Sign out
      </button>

      <p className="text-center text-xs text-ink-3">AgriDirect v1.0.0 · Built by Godi Naresh Reddy</p>
    </div>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-9 rounded-xl bg-bg flex items-center justify-center"><Icon className="size-4 text-primary" /></div>
      <div className="flex-1">
        <div className="text-xs text-ink-3">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
