import type { Product } from '@/lib/types';

export default function PriceDisplay({ product, size = 'md' }: { product: Pick<Product, 'price' | 'originalPrice'>; size?: 'sm' | 'md' | 'lg' }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice!) * 100) : 0;

  const priceClass = size === 'lg' ? 'font-serif text-3xl' : size === 'sm' ? 'text-sm' : 'font-serif text-lg';

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {hasDiscount && (
        <span className="text-[11px] tracking-shop uppercase bg-wine-dark text-beige px-1.5 py-0.5 self-center">
          {discountPercent}%
        </span>
      )}
      <span className={priceClass}>₩{product.price.toLocaleString()}</span>
      {hasDiscount && (
        <span className="text-xs text-ink/40 line-through">₩{product.originalPrice!.toLocaleString()}</span>
      )}
    </div>
  );
}
