'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Phone, User, Wheat, Star } from 'lucide-react';
import { farmerApi, productsApi } from '@/lib/api';
import { formatINR, productImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function PublicFarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [farmer, setFarmer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [farmerRes, productsRes] = await Promise.all([
          farmerApi.getPublicProfile(id),
          productsApi.list()
        ]);
        setFarmer(farmerRes.data ?? farmerRes);
        // Filter products belonging to this farmer
        const farmerProducts = (productsRes.data ?? productsRes ?? []).filter(
          (p: any) => p.farmerId === id || p.farmer?.id === id
        );
        setProducts(farmerProducts);
      } catch (err) {
        console.error('Failed to load farmer public profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!farmer) return <div className="text-center py-20 text-ink-2">Farmer profile not found.</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-ink-2 hover:text-primary mb-2 transition">
        <ArrowLeft className="size-5" /> Back
      </button>

      {/* Profile Header */}
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-0 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="size-24 rounded-full bg-primary text-white flex items-center justify-center text-4xl font-extrabold shadow-sm shrink-0">
          {(farmer.name || 'F').charAt(0)}
        </div>
        <div className="space-y-2 text-center md:text-left flex-1">
          <h1 className="text-3xl font-extrabold">{farmer.name || 'Farmer Profile'}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-ink-2">
            <span className="flex items-center gap-1"><MapPin className="size-4 text-primary" /> {farmer.location || 'India'}</span>
            {farmer.phone && <span className="flex items-center gap-1"><Phone className="size-4 text-primary" /> {farmer.phone}</span>}
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold flex items-center gap-2"><Wheat className="text-primary size-6" /> Products by {farmer.name}</h2>
        {products.length === 0 ? (
          <p className="text-ink-2 text-sm italic">This farmer hasn't listed any products yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const img = productImageUrl(p);
              return (
                <Link key={p.id} href={`/buyer/product/${p.id}`} className="card hover:shadow-lg transition flex flex-col overflow-hidden !p-0">
                  <div className="aspect-[4/3] relative bg-bg">
                    {img ? (
                      <Image src={img} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">🥬</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-ink-1 truncate">{p.name}</h3>
                      <p className="text-sm text-ink-2 line-clamp-2 mt-1">{p.description || 'Fresh produce directly from the farm.'}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-extrabold text-primary text-lg">{formatINR(p.price)} <span className="text-xs text-ink-2 font-normal">/ {p.unit || 'kg'}</span></span>
                      {p.averageRating && (
                        <span className="flex items-center gap-0.5 text-sm font-semibold bg-secondary/10 text-secondary rounded-full px-2 py-0.5">
                          <Star className="size-3.5 fill-secondary" /> {p.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
