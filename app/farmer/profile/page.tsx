'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Wheat, MapPin, BadgeCheck, Phone, Star, Package, ShoppingBag, IndianRupee, CreditCard, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import client, { clearAuthCookies, farmerApi } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default function FarmerProfile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingBank, setEditingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
  });

  useEffect(() => {
    Promise.all([
      client.get('/api/auth/me').then((r) => r.data?.data ?? null).catch(() => null),
      client.get('/api/farmer/profile').then((r) => r.data?.data ?? null).catch(() => null),
      client.get('/api/farmer/dashboard').then((r) => r.data?.data ?? null).catch(() => null),
      farmerApi.getBankDetails().then((r) => r.data ?? r).catch(() => null),
    ]).then(([u, p, s, b]) => {
      setUser(u);
      setProfile(p);
      setStats(s);
      setBankDetails(b);
      if (b) setBankForm({
        accountHolderName: b.accountHolderName || '',
        accountNumber: b.accountNumber || '',
        ifscCode: b.ifscCode || '',
        bankName: b.bankName || '',
        upiId: b.upiId || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const logout = () => {
    clearAuthCookies();
    toast.success('Signed out');
    router.push('/');
  };

  const saveBankDetails = async () => {
    setSavingBank(true);
    try {
      const res = await farmerApi.updateBankDetails(bankForm);
      setBankDetails(res.data ?? res);
      setEditingBank(false);
      toast.success('Bank details saved!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSavingBank(false);
    }
  };

  const name = user?.name || 'Farmer';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => (w[0] ?? '').toUpperCase())
    .join('');

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="card text-center">
          <div className="size-24 mx-auto rounded-full bg-bg mb-4" />
          <div className="h-6 bg-bg rounded w-1/3 mx-auto mb-2" />
          <div className="h-4 bg-bg rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar + name */}
      <div className="card text-center">
        <div className="size-24 mx-auto rounded-full bg-primary text-white flex items-center justify-center text-3xl font-extrabold mb-4">
          {initials || '🌾'}
        </div>
        <h1 className="text-2xl font-extrabold">{name}</h1>
        {user?.phone && (
          <p className="text-ink-2 flex items-center justify-center gap-1 mt-1">
            <Phone className="size-4" /> +91 {String(user.phone).replace(/^\+91/, '')}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full px-3 py-1">
          <Wheat className="size-3" /> Farmer
          {profile?.verified && <BadgeCheck className="size-3 text-success ml-1" />}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <IndianRupee className="size-5 text-success mx-auto mb-1" />
            <div className="text-xl font-extrabold">{formatINR(stats.totalRevenue ?? 0)}</div>
            <div className="text-xs text-ink-2">Total earnings</div>
          </div>
          <div className="card text-center">
            <ShoppingBag className="size-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-extrabold">{stats.totalOrders ?? 0}</div>
            <div className="text-xs text-ink-2">Total orders</div>
          </div>
          <div className="card text-center">
            <Package className="size-5 text-primary mx-auto mb-1" />
            <div className="text-xl font-extrabold">{stats.activeProducts ?? 0}</div>
            <div className="text-xs text-ink-2">Active products</div>
          </div>
          <div className="card text-center">
            <Star className="size-5 text-secondary mx-auto mb-1" />
            <div className="text-xl font-extrabold">{(stats.averageRating ?? 0).toFixed(1)}</div>
            <div className="text-xs text-ink-2">Rating</div>
          </div>
        </div>
      )}

      {/* Farm details */}
      {profile && (
        <div className="card space-y-3">
          <h2 className="font-extrabold text-lg">Farm details</h2>
          {profile.farmName && <Info icon={Wheat} label="Farm name" value={String(profile.farmName)} />}
          {profile.location && (
            <Info
              icon={MapPin}
              label="Location"
              value={
                typeof profile.location === 'string'
                  ? profile.location
                  : [profile.location.address, profile.location.city, profile.location.state]
                      .filter(Boolean)
                      .join(', ') || JSON.stringify(profile.location)
              }
            />
          )}
        </div>
      )}

      {/* Bank details */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg flex items-center gap-2">
            <CreditCard className="size-5 text-primary" /> Bank Details
          </h2>
          {!editingBank && (
            <button onClick={() => setEditingBank(true)} className="text-sm font-bold text-primary hover:underline">
              {bankDetails ? 'Edit' : 'Add'}
            </button>
          )}
        </div>

        {editingBank ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Account Holder Name</label>
              <input value={bankForm.accountHolderName} onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })} className="input w-full" placeholder="Name as per bank" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Account Number</label>
              <input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="input w-full" placeholder="Account number" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1">IFSC Code</label>
                <input value={bankForm.ifscCode} onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })} className="input w-full" placeholder="IFSC code" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Bank Name</label>
                <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} className="input w-full" placeholder="Bank name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">UPI ID (optional)</label>
              <input value={bankForm.upiId} onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })} className="input w-full" placeholder="yourname@upi" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingBank(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveBankDetails} disabled={savingBank} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {savingBank ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save
              </button>
            </div>
          </div>
        ) : bankDetails ? (
          <div className="space-y-3">
            <Info icon={CreditCard} label="Account holder" value={bankDetails.accountHolderName || 'Not set'} />
            <Info icon={CreditCard} label="Account number" value={bankDetails.accountNumber ? `****${bankDetails.accountNumber.slice(-4)}` : 'Not set'} />
            <Info icon={CreditCard} label="IFSC" value={bankDetails.ifscCode || 'Not set'} />
            <Info icon={CreditCard} label="Bank" value={bankDetails.bankName || 'Not set'} />
            {bankDetails.upiId && <Info icon={CreditCard} label="UPI" value={bankDetails.upiId} />}
          </div>
        ) : (
          <p className="text-ink-2 text-sm">No bank details added yet. Add your bank details to receive payouts.</p>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={logout}
        className="w-full card flex items-center justify-center gap-2 text-error font-bold hover:bg-error/5 transition"
      >
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
        <Icon className="size-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-ink-3">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
