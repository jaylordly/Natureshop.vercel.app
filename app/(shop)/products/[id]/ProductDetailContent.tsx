'use client';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import WishlistButton from '@/components/WishlistButton';
import ProductReviews from '@/components/ProductReviews';
import PriceDisplay from '@/components/PriceDisplay';
import ProductGallery from '@/components/ProductGallery';
import { useAuth } from '@/components/AuthProvider';
import { canViewProduct } from '@/lib/auth';
import type { Product } from '@/lib/types';

export default function ProductDetailContent({ product }: { product: Product }) {
  const { user } = useAuth();
  const hasAccess = canViewProduct(user?.role, product.visibility);

  if (!hasAccess) {
    return (
      <section className="container-narrow py-24">
        <div className="max-w-md mx-auto bg-card border border-gold/30 p-10 sm:p-12 text-center">
          <Lock className="w-8 h-8 text-gold mx-auto mb-5" />
          <p className="text-xs tracking-brow uppercase text-gold mb-3">Restricted</p>
          <h1 className="font-serif text-2xl mb-4">수강생 전용 제품입니다</h1>
          <p className="text-sm text-ink/60 mb-8 leading-relaxed">
            이 제품은 수강생 또는 관리자만 열람할 수 있습니다.
            <br />
            로그인 후 다시 방문해 주세요.
          </p>
          <Link
            href={`/login?redirect=/products/${product.id}`}
            className="inline-block bg-ink text-beige px-7 py-4 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            로그인하기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-narrow py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <ProductGallery productId={product.id} coverImage={product.image} coverAlt={product.name} />
        <div className="flex flex-col justify-center">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-gold text-sm tracking-shop uppercase">{product.category}</p>
            <WishlistButton productId={product.id} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl mb-4">{product.name}</h1>
          <p className="text-ink/70 mb-8 leading-relaxed">{product.description}</p>
          <div className="mb-8">
            <PriceDisplay product={product} size="lg" />
          </div>
          <AddToCartButton productId={product.id} max={product.stock} />
          <p className="text-xs text-ink/40 mt-4">재고: {product.stock}개</p>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </section>
  );
}
