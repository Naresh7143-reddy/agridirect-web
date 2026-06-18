'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/common/ProductCard';

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="text-4xl">⏳</div></div>}>
      <BrowseInner />
    </Suspense>
  );
}

function BrowseInner() {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initial);

  useEffect(() => {
    productsApi.list().then((r) => setProducts(r.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">All produce</h1>
        <p className="text-ink-2">{filtered.length} items from verified farmers</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-ink-3" />
          <input
            type="search"
            placeholder="Search produce…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-white shadow-card border-2 border-transparent focus:border-primary outline-none"
            data-testid="browse-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white shadow-card animate-pulse">
              <div className="aspect-[4/3] bg-bg" />
              <div className="p-4"><div className="h-4 bg-bg rounded w-3/4 mb-2" /><div className="h-3 bg-bg rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-card">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-semibold">No products match "{query}"</p>
          <p className="text-ink-2 mt-2">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
