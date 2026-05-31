'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { canViewProduct } from '@/lib/auth';
import WishlistButton from './WishlistButton';
import PriceDisplay from './PriceDisplay';

const LOW_STOCK = 5;

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const visible = canViewProduct(user?.role, product.visibility);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock < LOW_STOCK;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-card border border-gold/20 hover:border-gold/60 hover:shadow-gold-glow-soft transition relative"
      {...(!visible ? { 'aria-label': `${product.name} (수강생 전용)` } : {})}
    >
      <div className="absolute top-2 right-2 z-10 bg-beige/80 backdrop-blur-sm p-1.5 rounded-full">
        <WishlistButton productId={product.id} />
      </div>
      <div className="relative aspect-square bg-cream overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`object-cover transition duration-700 group-hover:scale-105 ${visible && !soldOut ? '' : 'blur-md'}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {!visible && (
          <div className="absolute inset-0 bg-ink/30 flex flex-col items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-beige" />
            <p className="text-[10px] tracking-cta uppercase text-beige/85">수강생 전용</p>
          </div>
        )}
        {visible && soldOut && (
          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
            <p className="text-xs tracking-cta uppercase text-beige border border-beige/60 px-3 py-1">품절</p>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {lowStock && (
            <span className="text-[10px] tracking-shop uppercase bg-wine-dark text-beige px-2 py-0.5">품절임박</span>
          )}
          {product.isBest && (
            <span className="text-[10px] tracking-shop uppercase bg-gold text-beige px-2 py-0.5">Best</span>
          )}
          {product.isNew && (
            <span className="text-[10px] tracking-shop uppercase bg-ink text-beige px-2 py-0.5">New</span>
          )}
          {product.visibility !== 'public' && (
            <span className="text-[10px] tracking-shop uppercase bg-card border border-gold/40 text-gold-dark px-2 py-0.5">
              {product.visibility === 'student' ? '수강생' : 'Admin'}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] tracking-shop uppercase text-gold mb-1">{product.category}</p>
        <p className="text-sm mb-2 group-hover:text-gold transition line-clamp-1">{product.name}</p>
        <PriceDisplay product={product} />
      </div>
    </Link>
  );
}
