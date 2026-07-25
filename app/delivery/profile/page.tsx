'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, User, Phone, Truck, Camera, MapPin, Star, Package, LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';
import { deliveryApi, clearAuthCookies } from '@/lib/api';
import client from '@/lib/api';

export default function DeliveryProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', vehicleType: '' });

  useEffect(() => {
    Promise.all([
      deliveryApi.getProfile().then((r) => r.data ?? r).catch(() => null),
      client.get('/api/auth/me').then((r) => r.data?.data ?? null).catch(() => null),
    ]).then(([p, u]) => {
      setProfile(p);
      setUser(u);
      if (p) setForm({ name: p.name || u?.name || '', phone: p.phone || u?.phone || '', vehicleType: p.vehicleType || 'BIKE' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await deliveryApi.updateProfile(form);
      setProfile(res.data ?? res);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Uploading photo…', { id: 'photo' });
      await deliveryApi.uploadPhoto(file);
      toast.dismiss('photo');
      toast.success('Photo updated!');
      // Reload profile
      const p = await deliveryApi.getProfile().then((r) => r.data ?? r);
      setProfile(p);
    } catch {
      toast.dismiss('photo');
      toast.error('Upload failed');
    }
  };

  const logout = () => {
    clearAuthCookies();
    toast.success('Signed out');
    router.push('/');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  const name = form.name || user?.name || 'Delivery Partner';
  const initials = name.split(' ').slice(0, 2).map((w: string) => (w[0] ?? '').toUpperCase()).join('');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar + name */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
        <div className="relative inline-block">
          <div className="size-24 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-extrabold overflow-hidden">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : initials || '🚲'}
          </div>
          <label className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:scale-110 transition shadow-md">
            <Camera className="size-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <h1 className="text-2xl font-extrabold mt-4">{name}</h1>
        {user?.phone && (
          <p className="text-ink-2 flex items-center justify-center gap-1 mt-1">
            <Phone className="size-4" /> +91 {String(user.phone).replace(/^\+91/, '')}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-3 py-1">
          <Truck className="size-3" /> Delivery Partner
        </div>
      </motion.div>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card text-center">
            <Package className="size-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-extrabold">{profile.totalDeliveries ?? 0}</div>
            <div className="text-xs text-ink-2">Deliveries</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card text-center">
            <Star className="size-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl font-extrabold">{(profile.avgRating ?? 0).toFixed(1)}</div>
            <div className="text-xs text-ink-2">Rating</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card text-center">
            <Truck className="size-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-extrabold capitalize">{profile.vehicleType?.toLowerCase() ?? 'bike'}</div>
            <div className="text-xs text-ink-2">Vehicle</div>
          </motion.div>
        </div>
      )}

      {/* Edit form */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg">Profile Details</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm font-bold text-primary hover:underline">Edit</button>
          )}
        </div>

        {editing ? (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1">Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input w-full" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" placeholder="Phone number" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Vehicle Type</label>
              <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="input w-full">
                <option value="BIKE">Bike</option>
                <option value="SCOOTER">Scooter</option>
                <option value="CYCLE">Cycle</option>
                <option value="AUTO">Auto</option>
                <option value="VAN">Van</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Info icon={User} label="Name" value={form.name || 'Not set'} />
            <Info icon={Phone} label="Phone" value={form.phone || 'Not set'} />
            <Info icon={Truck} label="Vehicle" value={form.vehicleType || 'Not set'} />
            {profile?.currentLat && profile?.currentLng && (
              <Info icon={MapPin} label="Last Location" value={`${profile.currentLat.toFixed(4)}, ${profile.currentLng.toFixed(4)}`} />
            )}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button onClick={logout} className="w-full card flex items-center justify-center gap-2 text-error font-bold hover:bg-error/5 transition">
        <LogOut className="size-5" /> Sign out
      </button>

      <p className="text-center text-xs text-ink-3">AgriDirect v1.0.0 · Built by Godi Naresh Reddy</p>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-9 rounded-xl bg-bg flex items-center justify-center">
        <Icon className="size-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-ink-3">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
