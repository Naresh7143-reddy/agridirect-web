'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2, Trash2, Star, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { buyerApi } from '@/lib/api';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', city: '', state: '', pincode: '' });

  const load = () => {
    setLoading(true);
    buyerApi.getAddresses()
      .then((r) => setAddresses(r.data || []))
      .catch(() => toast.error('Could not load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const useGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported by your browser');
      return;
    }
    toast.info('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          const data = await r.json();
          const a = data.address || {};
          setNewAddr((prev) => ({
            ...prev,
            line1: [a.house_number, a.road || a.neighbourhood].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '',
            city: a.city || a.town || a.village || '',
            state: a.state || '',
            pincode: a.postcode || '',
          }));
          toast.success('Location filled');
        } catch {
          toast.error('Reverse geocoding failed — please type manually');
        }
      },
      (err) => toast.error(err.message || 'Could not get location'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const saveAddress = async () => {
    if (!newAddr.line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) {
      toast.error('Fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await buyerApi.addAddress({ ...newAddr, setAsDefault: addresses.length === 0 });
      toast.success('Address saved');
      setShowAddForm(false);
      setNewAddr({ label: 'Home', line1: '', city: '', state: '', pincode: '' });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await buyerApi.deleteAddress(id);
      toast.success('Address removed');
      setAddresses((a) => a.filter((x) => x.id !== id));
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not delete address');
    }
  };

  const makeDefault = async (id: string) => {
    try {
      await buyerApi.setDefaultAddress(id);
      setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
      toast.success('Default address updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Could not update default');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/buyer/profile" className="size-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary/40">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">Saved addresses</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {addresses.length === 0 && !showAddForm && (
            <div className="card text-center py-10 text-ink-2">
              <MapPin className="size-10 mx-auto mb-3 text-ink-3" />
              No saved addresses yet.
            </div>
          )}

          {addresses.length > 0 && (
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="card flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {a.label}
                      {a.isDefault && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">Default</span>}
                    </div>
                    <div className="text-sm text-ink-2 mt-1">{a.line1}, {a.city}, {a.state} — {a.pincode}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!a.isDefault && (
                      <button onClick={() => makeDefault(a.id)} title="Set as default" className="size-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary/40">
                        <Star className="size-4" />
                      </button>
                    )}
                    <button onClick={() => remove(a.id)} title="Delete" className="size-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-error/40 hover:text-error">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddForm ? (
            <div className="card space-y-3">
              <button onClick={useGPS} className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary text-primary py-3 font-semibold hover:bg-primary/5">
                📍 Use my current location
              </button>
              <input
                placeholder="Label (e.g. Home, Work)"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                {(['line1', 'city', 'state', 'pincode'] as const).map((k) => (
                  <input
                    key={k}
                    placeholder={k === 'line1' ? 'Address line *' : k[0].toUpperCase() + k.slice(1) + ' *'}
                    value={(newAddr as any)[k]}
                    onChange={(e) => setNewAddr({ ...newAddr, [k]: e.target.value })}
                    className={k === 'line1' ? 'sm:col-span-2 px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none' : 'px-4 py-3 rounded-2xl border-2 border-border focus:border-primary outline-none'}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveAddress} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="size-5 animate-spin" /> : 'Save address'}
                </button>
                <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="w-full card flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5">
              <Plus className="size-5" /> Add new address
            </button>
          )}
        </>
      )}
    </div>
  );
}
