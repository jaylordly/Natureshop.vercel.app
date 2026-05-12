'use client';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { getProductById } from '@/lib/products';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus } from 'lucide-react';
import { Eyebrow } from '@/components/Eyebrow';

export default function CartPage() {
  const { items, update, remove } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const cartProducts = items
    .map((i) => ({ item: i, product: getProductById(i.productId) }))
    .filter((x): x is { item: { productId: string; quantity: number }; product: NonNullable<ReturnType<typeof getProductById>> } => !!x.product);

  const subtotal = cartProducts.reduce((s, { item, product }) => s + item.quantity * product.price, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-4xl mb-4">장바구니가 비어있어요</h1>
        <p className="text-ink/60 mb-10">시그니처 컬렉션에서 첫 제품을 만나보세요.</p>
        <Link
          href="/products"
          className="inline-block bg-ink text-beige px-7 py-4 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
        >
          쇼핑 계속하기
        </Link>
      </section>
    );
  }

  return (
    <section className="container-narrow py-16">
      <Eyebrow text="Shopping Bag" className="mb-7" />
      <h1 className="font-serif text-4xl sm:text-5xl mb-10 text-center tracking-tight">장바구니</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {cartProducts.map(({ item, product }) => (
            <div key={item.productId} className="flex gap-4 py-6 border-b border-gold/30 first:border-t">
              <Link
                href={`/products/${product.id}`}
                className="relative w-24 h-24 sm:w-28 sm:h-28 bg-card border border-gold/20 shrink-0"
              >
                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="112px" />
              </Link>
              <div className="flex-1 flex flex-col">
                <p className="text-[10px] tracking-shop uppercase text-gold mb-1">{product.category}</p>
                <Link href={`/products/${product.id}`} className="text-sm hover:text-gold transition mb-1">
                  {product.name}
                </Link>
                <p className="font-serif text-base mt-auto">₩{(product.price * item.quantity).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => remove(item.productId)} className="p-1 text-ink/40 hover:text-ink" aria-label="삭제">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex border border-gold/40">
                  <button
                    onClick={() => update(item.productId, item.quantity - 1)}
                    className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-ink/5"
                    aria-label={`${product.name} 수량 감소`}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-9 h-11 sm:h-9 flex items-center justify-center text-sm" aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => update(item.productId, Math.min(product.stock, item.quantity + 1))}
                    className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-ink/5"
                    aria-label={`${product.name} 수량 증가`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="bg-card border border-gold/30 p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-serif text-xl mb-6">주문 요약</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">상품 합계</span>
              <span>₩{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">배송비</span>
              <span>무료</span>
            </div>
          </div>
          <div className="border-t border-divider mt-6 pt-6 flex justify-between items-baseline">
            <span className="font-serif text-base tracking-wide text-ink/80">합계</span>
            <span className="font-serif text-3xl tracking-tight text-gold-dark">₩{total.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="block text-center w-full mt-6 bg-gold text-beige py-4 hover:bg-gold-soft hover:shadow-gold-glow transition-all tracking-cta uppercase text-xs font-medium"
          >
            {user ? '주문하기' : '로그인 후 주문하기'}
          </button>
          <p className="text-[10px] text-espresso mt-3 text-center tracking-wide">데모 모드 — 실제 결제는 발생하지 않습니다</p>
        </aside>
      </div>
    </section>
  );
}
