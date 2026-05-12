'use client';
import { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import { useToast } from './Toast';

export default function AddToCartButton({ productId, max }: { productId: string; max: number }) {
  const { add } = useCart();
  const { show } = useToast();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(productId, qty);
    setAdded(true);
    show(`장바구니에 ${qty}개 담았어요`, 'success');
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-3">
        <div className="flex border border-gold/40 h-11 sm:h-10">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-11 sm:w-10 hover:bg-ink/5 flex items-center justify-center"
            aria-label="감소"
            type="button"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 flex items-center justify-center text-sm">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="w-11 sm:w-10 hover:bg-ink/5 flex items-center justify-center"
            aria-label="증가"
            type="button"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={handleAdd}
          disabled={max <= 0}
          className="flex-1 bg-ink text-beige tracking-shop text-xs uppercase py-3 hover:bg-gold hover:text-ink transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {added ? (
            <>
              <Check className="w-4 h-4" /> 담았습니다
            </>
          ) : max <= 0 ? (
            '품절'
          ) : (
            '장바구니 담기'
          )}
        </button>
      </div>
      {added && (
        <Link
          href="/cart"
          className="text-[11px] tracking-cta uppercase text-gold underline-offset-4 hover:underline text-center"
        >
          장바구니 보기
        </Link>
      )}
    </div>
  );
}
