'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

function FailInner() {
  const params = useSearchParams();
  const code = params.get('code');
  const message = params.get('message') || '결제가 취소되었거나 실패했습니다.';
  const orderId = params.get('orderId');

  return (
    <section className="container-narrow py-24 max-w-md text-center">
      <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-4" />
      <h1 className="font-serif text-2xl mb-3">결제가 완료되지 않았습니다</h1>
      <p className="text-sm text-ink/70 mb-2">{message}</p>
      {(code || orderId) && (
        <p className="text-xs text-ink/40 mb-8 font-mono">
          {code && <>code: {code} </>}
          {orderId && <>· orderId: {orderId}</>}
        </p>
      )}
      <div className="flex gap-3 justify-center">
        <Link
          href="/checkout"
          className="border border-gold/40 px-6 py-3 text-xs tracking-cta uppercase hover:bg-ink hover:text-beige transition"
        >
          결제 다시 시도
        </Link>
        <Link
          href="/cart"
          className="bg-ink text-beige px-6 py-3 text-xs tracking-cta uppercase hover:bg-gold hover:text-ink transition"
        >
          장바구니로
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={null}>
      <FailInner />
    </Suspense>
  );
}
