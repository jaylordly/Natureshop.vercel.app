'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Package } from 'lucide-react';
import { getAllProductsFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';

const LOW_STOCK_THRESHOLD = 5;

export default function LowStockAlert() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await getAllProductsFromDb();
      const low = all.filter((p) => p.stock < LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);
      if (!cancelled) {
        setItems(low);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-wine-dark/5 border border-wine-dark/30 p-5 sm:p-6 mb-10">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-wine-dark" />
        <p className="text-[11px] tracking-shop uppercase text-wine-dark">재고 부족 경고 ({items.length}건)</p>
      </div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2 hover:text-gold transition min-w-0">
              <Package className="w-3.5 h-3.5 text-ink/40 shrink-0" />
              <span className="truncate">{p.name}</span>
              <span className="text-xs text-ink/40 font-mono shrink-0">{p.id}</span>
            </Link>
            <span className={`text-xs font-medium ${p.stock === 0 ? 'text-wine-dark' : 'text-espresso'}`}>
              {p.stock === 0 ? '품절' : `${p.stock}개 남음`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
