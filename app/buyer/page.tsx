'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Search, MapPin, Sparkles } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';

export default function BuyerHome() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.list().catch(() => null), categoriesApi.list().catch(() => null)])
      .then(([p, c]) => {
        if (p?.data) setProducts(p.data);
        if (c?.data) setCategories(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white p-8 sm:p-12 relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 text-9xl opacity-10">🌾</div>
        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-4">
          <MapPin className="size-4" />
          Delivering to your area
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
          Today's harvest,<br />on your table tomorrow
        </h1>
        <p className="mt-4 text-lg text-white/90 max-w-xl">
          Discover fresh produce from {products.length || 'verified'} farmers near you.
        </p>
        <Link href="/buyer/browse" className="mt-8 inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-full px-6 py-3 hover:scale-105 transition">
          Start shopping <ArrowRight className="size-5" />
        </Link>
      </motion.section>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); router.push(`/buyer/browse${search ? `?q=${encodeURIComponent(search)}` : ''}`); }}
        className="relative"
      >
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-ink-3" />
        <input
          type="search"
          placeholder="Search for tomatoes, onions, mangoes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 rounded-full bg-white shadow-card border-2 border-transparent focus:border-primary outline-none text-lg"
        />
      </form>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <SectionTitle title="Shop by category" link="/buyer/browse" />
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/buyer/browse?categoryId=${c.id}`}
                className="aspect-square rounded-2xl bg-white shadow-card hover:shadow-hover hover:-translate-y-1 transition flex flex-col items-center justify-center p-3"
              >
                <div className="text-3xl mb-1">🥬</div>
                <div className="text-xs font-semibold text-center text-ink-1 line-clamp-2">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI banner */}
      <Link
        href="/buyer/ai"
        className="block rounded-3xl bg-gradient-to-r from-secondary/20 to-primary/10 p-6 sm:p-8 hover:shadow-hover transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">Krishi AI</span>
            </div>
            <h3 className="text-2xl font-extrabold">Ask anything about farming</h3>
            <p className="text-ink-2 mt-1">From "best fertilizer for tomato" to disease detection. Free.</p>
          </div>
          <ArrowRight className="size-6 text-primary hidden sm:block" />
        </div>
      </Link>

      {/* Fresh products */}
      <section>
        <SectionTitle title="Fresh from farms" link="/buyer/browse" />
        {loading ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <Link href={link} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
        View all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white shadow-card animate-pulse">
          <div className="aspect-[4/3] bg-bg" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-bg rounded w-3/4" />
            <div className="h-3 bg-bg rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl shadow-card">
      <div className="text-6xl mb-4">🌱</div>
      <p className="font-semibold text-lg">No products yet</p>
      <p className="text-ink-2 mt-1">Check back soon!</p>
    </div>
  );
}
