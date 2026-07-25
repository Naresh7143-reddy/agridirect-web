'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, MapPin, Package, Bell, HelpCircle, FileText, Shield, LogOut, ChevronRight, Edit2, Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import client, { buyerProfileApi } from '@/lib/api';

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
  const [showEdit, setShowEdit] = useState(false);

  const load = () => {
    client.get('/api/auth/me')
      .then((r) => setUser(r.data?.data ?? null))
      .catch(() => setUser(null));
  };
  useEffect(load, []);

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
      <div className="card text-center relative group overflow-hidden">
        <button
          onClick={() => setShowEdit(true)}
          className="absolute top-4 right-4 p-2 bg-bg text-primary rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shadow-sm hover:scale-110 z-10"
          title="Edit Profile"
        >
          <Edit2 className="size-5" />
        </button>
        <div className="relative size-24 mx-auto mb-4">
          <div className="size-full rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold overflow-hidden ring-4 ring-bg relative">
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt={rawName} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <button onClick={() => setShowEdit(true)} className="absolute bottom-0 right-0 bg-white text-primary p-1.5 rounded-full shadow-md border border-border hover:bg-primary hover:text-white transition">
            <Edit2 className="size-3.5" />
          </button>
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

      {showEdit && <EditProfileModal user={user} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); load(); }} />}
    </div>
  );
}

function EditProfileModal({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(user?.photoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setBusy(true);
    try {
      if (imageFile) {
        toast.loading('Uploading photo…', { id: 'photo-upload' });
        try {
          await buyerProfileApi.uploadPhoto(imageFile);
          toast.dismiss('photo-upload');
        } catch (e: any) {
          toast.dismiss('photo-upload');
          toast.error('Failed to upload photo');
        }
      }
      
      await buyerProfileApi.update({ name: name.trim() });
      toast.success('Profile updated');
      onSuccess();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-extrabold mb-6">Edit Profile</h2>
        
        <div className="flex flex-col items-center mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="relative size-24 mb-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="size-full rounded-full border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-gray-50 group relative"
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="size-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <ImagePlus className="size-6" />
                </div>
              )}
            </div>
            {imagePreview && (
              <button
                onClick={clearImage}
                className="absolute top-0 right-0 bg-white text-error rounded-full p-1 shadow border border-border hover:bg-error hover:text-white transition z-10"
                title="Remove photo"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <span className="text-xs text-ink-3">Click photo to update</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input
              type="text"
              value={user?.phone || ''}
              disabled
              className="w-full px-4 py-3 rounded-2xl border-2 border-border/50 bg-bg text-ink-3 outline-none cursor-not-allowed"
            />
            <p className="text-xs text-ink-3 mt-1">Phone number cannot be changed</p>
          </div>
        </div>

        <div className="flex gap-2 mt-8">
          <button onClick={onClose} className="btn-secondary flex-1 py-3">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary flex-1 py-3">
            {busy ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
