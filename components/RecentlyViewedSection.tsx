'use client';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { readRecentlyViewed } from './RecentlyViewedTracker';
import { getAllProductsFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export default function RecentlyViewedSection({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ids = readRecentlyViewed().filter((id) => id !== excludeId);
    if (ids.length === 0) {
      setReady(true);
      return;
    }
    (async () => {
      const all = await getAllProductsFromDb();
      const map = new Map(all.map((p) => [p.id, p]));
      setProducts(ids.map((id) => map.get(id)).filter((p): p is Product => !!p).slice(0, 4));
      setReady(true);
    })();
  }, [excludeId]);

  if (!ready || products.length === 0) return null;

  return (
    <section className="container-narrow py-12 border-t border-gold/20">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-4 h-4 text-gold" />
        <p className="text-[11px] tracking-cta uppercase text-gold">Recently Viewed</p>
      </div>
      <h2 className="font-serif text-2xl mb-6">최근 본 상품</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
