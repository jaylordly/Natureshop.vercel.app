'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import {
  clearPendingOrder,
  createOrderInDb,
  getOrderFromDb,
  getPendingOrder,
} from '@/lib/orders';
import { getProductById } from '@/lib/products';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; orderId: string; awaitingDeposit?: boolean };

function SuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { clear } = useCart();
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = Number(params.get('amount'));

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setState({ kind: 'error', message: '필수 결제 정보가 누락되었습니다.' });
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        // idempotency: 이미 생성된 주문이면 confirm을 건너뛴다(새로고침 시 중복 confirm 에러 방지).
        const existing = await getOrderFromDb(orderId);
        if (cancelled) return;
        if (existing) {
          clearPendingOrder(orderId);
          clear();
          setState({ kind: 'success', orderId, awaitingDeposit: existing.status === 'pending' });
          setTimeout(() => router.replace(`/orders/${orderId}`), 1200);
          return;
        }

        // 주문 정보를 먼저 읽어 항목(items)을 서버 금액 검증에 전달한다.
        const pending = getPendingOrder(orderId);
        if (!pending) {
          setState({ kind: 'error', message: '주문 정보를 찾을 수 없습니다. 처음부터 다시 시도해 주세요.' });
          return;
        }
        if (!user || user.id.startsWith('demo-')) {
          setState({ kind: 'error', message: '로그인 정보를 찾을 수 없습니다. 다시 로그인 후 시도해 주세요.' });
          return;
        }

        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
            items: pending.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            couponCode: pending.couponCode,
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!data.ok) {
          setState({ kind: 'error', message: data.error || '결제 승인에 실패했습니다.' });
          return;
        }

        const payment = data.payment;
        // 서버가 검증·계산한 권위 있는 가격을 우선 사용. (데모/미설정 환경에선 폴백)
        const pricing = data.pricing as
          | { items: { productId: string; quantity: number; priceAtPurchase: number }[]; discount: number; total: number }
          | null;
        const itemsWithPrice =
          pricing?.items ??
          pending.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceAtPurchase: getProductById(i.productId)?.price ?? 0,
          }));
        const orderTotal = pricing?.total ?? pending.total;
        const orderDiscount = pricing?.discount ?? pending.discount;

        // 가상계좌(무통장) 분기 — 입금 대기 상태로 주문 생성
        const isVbank = payment?.status === 'WAITING_FOR_DEPOSIT';
        const va = payment?.virtualAccount as
          | { bankCode?: string; bank?: string; accountNumber?: string; customerName?: string; dueDate?: string }
          | undefined;
        const vbank = isVbank
          ? { bank: va?.bank ?? va?.bankCode, accountNumber: va?.accountNumber, holder: va?.customerName, dueDate: va?.dueDate }
          : undefined;

        const { order, error } = await createOrderInDb({
          id: orderId,
          userId: user.id,
          items: itemsWithPrice,
          total: orderTotal,
          shipping: pending.shipping,
          status: isVbank ? 'pending' : 'paid',
          paymentKey,
          paymentMethod: payment?.method,
          receiptUrl: payment?.receipt?.url,
          couponCode: pending.couponCode,
          discount: orderDiscount,
          vbank,
          vbankDue: vbank?.dueDate,
        });
        if (error || !order) {
          setState({ kind: 'error', message: `주문 저장 실패: ${error ?? '알 수 없는 오류'}` });
          return;
        }

        // 주문확인/입금안내 이메일 (서버, best-effort)
        fetch('/api/orders/notify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        }).catch(() => {});

        clearPendingOrder(orderId);
        clear();
        setState({ kind: 'success', orderId: order.id, awaitingDeposit: isVbank });
        // 1초 보여주고 주문 상세로 이동
        setTimeout(() => router.replace(`/orders/${order.id}`), 1200);
      } catch (err) {
        console.error('[checkout/success] 확인 중 오류:', err);
        if (!cancelled) setState({ kind: 'error', message: '결제 확인 중 오류가 발생했습니다.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentKey, orderId, amount, clear, router, user]);

  if (state.kind === 'loading') {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-7 h-7 text-gold animate-spin mx-auto mb-4" />
          <p className="text-sm text-ink/70">결제 확인 중입니다…</p>
        </div>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section className="container-narrow py-24 max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-4" />
        <h1 className="font-serif text-2xl mb-3">결제 처리 중 문제가 발생했습니다</h1>
        <p className="text-sm text-ink/70 mb-8">{state.message}</p>
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

  return (
    <section className="container-narrow py-24 max-w-md text-center">
      <CheckCircle className="w-12 h-12 text-gold mx-auto mb-4" />
      <h1 className="font-serif text-3xl mb-3">
        {state.awaitingDeposit ? '주문이 접수되었습니다' : '결제가 완료되었습니다'}
      </h1>
      <p className="text-sm text-ink/60">
        {state.awaitingDeposit
          ? '입금 안내를 확인해 주세요. 주문 상세로 이동합니다…'
          : '주문 상세 페이지로 이동합니다…'}
      </p>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
