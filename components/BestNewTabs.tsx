'use client';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export default function BestNewTabs({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<'best' | 'new'>('best');
  const list = tab === 'best' ? products.filter((p) => p.isBest) : products.filter((p) => p.isNew);

  return (
    <section className="container-narrow py-20">
      <div className="text-center mb-10">
        <p className="text-gold text-sm tracking-shop uppercase mb-2">Showcase</p>
        <h2 className="font-serif text-3xl sm:text-4xl mb-6">셀렉션</h2>
        <div className="inline-flex border border-gold/40">
          {(['best', 'new'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 text-xs tracking-shop uppercase transition ${
                tab === t ? 'bg-ink text-beige' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {t === 'best' ? 'Best' : 'New'}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="text-center text-ink/50 py-10">등록된 상품이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
