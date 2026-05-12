'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { listWishlist } from '@/lib/wishlist';
import { getAllProductsFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeleton';

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.id.startsWith('demo-'))) {
      router.push('/login?redirect=/account/wishlist');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.id.startsWith('demo-')) return;
    (async () => {
      const [ids, all] = await Promise.all([listWishlist(), getAllProductsFromDb()]);
      const set = new Set(ids);
      setProducts(all.filter((p) => set.has(p.id)));
      setReady(true);
    })();
  }, [user]);

  if (!user || user.id.startsWith('demo-')) {
    return <section className="container-narrow py-24 text-center text-ink/40">불러오는 중...</section>;
  }

  return (
    <section className="container-narrow py-12">
      <Link href="/account" className="text-xs text-ink/60 hover:text-gold transition">← 내 계정</Link>
      <div className="my-6">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">My Wishlist</p>
        <h1 className="font-serif text-3xl flex items-center gap-2">
          <Heart className="w-7 h-7 fill-wine-dark text-wine-dark" /> 찜한 상품
        </h1>
      </div>

      {!ready ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-10 h-10 text-ink/15 mx-auto mb-4" />
          <p className="text-sm text-ink/50 mb-5">찜한 상품이 없어요</p>
          <Link href="/products" className="inline-block bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition">
            상품 보러가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  );
}
