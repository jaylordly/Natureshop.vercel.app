import ProductCard from '@/components/ProductCard';
import CategoryTabs from '@/components/CategoryTabs';
import ProductSearchBar from '@/components/ProductSearchBar';
import ProductSortBar from '@/components/ProductSortBar';
import { getAllProductsFromDb } from '@/lib/products';
import { Suspense } from 'react';
import { Eyebrow } from '@/components/Eyebrow';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '전체 상품',
  description: '머신·엠보·색소·위생·케어까지 — 반영구 시술 전문가를 위한 엄선된 컬렉션.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: '전체 상품',
    description: '반영구 시술 전문가를 위한 엄선된 컬렉션.',
    url: '/products',
    type: 'website',
  },
};

export default async function ProductsPage({ searchParams }: { searchParams: { cat?: string; q?: string; sort?: string } }) {
  const cat = searchParams?.cat;
  const q = searchParams?.q?.toLowerCase().trim() ?? '';
  const sort = searchParams?.sort ?? 'default';
  const all = await getAllProductsFromDb();
  let products = all.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
    return true;
  });

  if (sort === 'price-asc') products = [...products].sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price);
  else if (sort === 'name') products = [...products].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  else {
    products = [...products].sort((a, b) => {
      if (a.isBest !== b.isBest) return a.isBest ? -1 : 1;
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });
  }

  return (
    <section className="container-narrow py-16">
      <header className="mb-10 text-center">
        <Eyebrow text="All Products" className="mb-7" />
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">{cat || '전체 상품'}</h1>
      </header>
      <Suspense fallback={null}>
        <CategoryTabs />
        <ProductSearchBar />
        <ProductSortBar />
      </Suspense>
      {products.length === 0 ? (
        <p className="text-center text-ink/50 py-16">
          {q ? `"${q}" 검색 결과가 없어요.` : '선택한 카테고리에 상품이 없어요.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
