'use client';
import { useEffect, useState } from 'react';
import { getOrderFromDb, type DbOrder } from '@/lib/orders';
import { Check, Clock, AlertTriangle, Receipt, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { STATUS_LABEL, STATUS_BADGE, type OrderStatus } from '@/lib/status-style';
import { Eyebrow } from '@/components/Eyebrow';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';

interface StatusMeta {
  title: string;
  Icon: React.ElementType;
  iconClass: string;
  iconBg: string;
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  paid: {
    title: '결제가 완료되었습니다',
    Icon: Check,
    iconClass: 'text-gold',
    iconBg: 'bg-gold/15',
  },
  pending: {
    title: '결제 대기 중입니다',
    Icon: Clock,
    iconClass: 'text-espresso',
    iconBg: 'bg-cream',
  },
  failed: {
    title: '결제가 실패했습니다',
    Icon: AlertTriangle,
    iconClass: 'text-wine-dark',
    iconBg: 'bg-wine-dark/10',
  },
  demo: {
    title: '주문이 완료되었습니다',
    Icon: Check,
    iconClass: 'text-gold',
    iconBg: 'bg-gold/15',
  },
  refunded: {
    title: '환불 처리되었습니다',
    Icon: AlertTriangle,
    iconClass: 'text-ink/50',
    iconBg: 'bg-ink/10',
  },
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DbOrder | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const o = await getOrderFromDb(id);
      if (!cancelled) setOrder(o);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (order === undefined) {
    return <section className="container-narrow py-24 text-center text-ink/50">불러오는 중…</section>;
  }
  if (order === null) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl mb-4">주문을 찾을 수 없어요</h1>
        <Link href="/products" className="text-gold hover:underline">
          쇼핑하러 가기
        </Link>
      </section>
    );
  }

  const meta = STATUS_META[order.status];

  return (
    <section className="container-narrow py-16 max-w-2xl">
      <Eyebrow text="Order" className="mb-7" />
      <div className="text-center mb-12">
        <div className={`inline-flex w-16 h-16 ${meta.iconBg} ${meta.iconClass} rounded-full items-center justify-center mb-6`}>
          <meta.Icon className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl mb-3 tracking-tight">{meta.title}</h1>
        <p className="text-ink/60 text-sm">
          주문번호: <span className="font-mono">{order.id}</span>
        </p>
      </div>

      <div className="bg-card border border-gold/30 p-6 mb-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      {/* 결제 정보 */}
      <div className="bg-card border border-gold/30 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg">결제 정보</h2>
          <span className={`inline-block px-3 py-1 text-[10px] tracking-shop uppercase ${STATUS_BADGE[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <dl className="text-sm space-y-2">
          <div className="flex">
            <dt className="w-24 text-ink/60">결제 수단</dt>
            <dd>{order.paymentMethod || (order.status === 'demo' ? '데모 — 미결제' : '—')}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-ink/60">결제 일시</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-ink/60">결제 금액</dt>
            <dd className="font-medium">₩{order.total.toLocaleString()}</dd>
          </div>
          {order.paymentKey && (
            <div className="flex">
              <dt className="w-24 text-ink/60">결제 키</dt>
              <dd className="font-mono text-xs break-all text-ink/70">{order.paymentKey}</dd>
            </div>
          )}
        </dl>
        {order.receiptUrl && (
          <a
            href={order.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 border border-gold/40 px-4 py-2.5 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            영수증 보기
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* 주문 상품 */}
      <div className="bg-card border border-gold/30 p-6 sm:p-8 mb-6">
        <h2 className="font-serif text-lg mb-4">주문 상품</h2>
        <div className="space-y-3 text-sm">
          {order.items.map((i) => (
            <div key={i.productId} className="flex justify-between">
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span>₩{(i.priceAtPurchase * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {order.discountAmount > 0 && (
          <div className="border-t border-gold/15 mt-4 pt-3 flex justify-between text-sm text-gold-dark">
            <span>쿠폰 할인{order.couponCode && ` (${order.couponCode})`}</span>
            <span>-₩{order.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-gold/30 mt-4 pt-4 flex justify-between font-serif text-lg">
          <span>합계</span>
          <span>₩{order.total.toLocaleString()}</span>
        </div>
      </div>

      {/* 배송 정보 */}
      <div className="bg-card border border-gold/30 p-6 sm:p-8 mb-12">
        <h2 className="font-serif text-lg mb-4">배송 정보</h2>
        <dl className="text-sm space-y-2">
          <div className="flex">
            <dt className="w-24 text-ink/60">받는 사람</dt>
            <dd>{order.shipping.name}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-ink/60">연락처</dt>
            <dd>{order.shipping.phone}</dd>
          </div>
          <div className="flex">
            <dt className="w-24 text-ink/60">배송지</dt>
            <dd>{order.shipping.address}</dd>
          </div>
        </dl>
      </div>

      <div className="text-center">
        <Link
          href="/products"
          className="inline-block bg-ink text-beige px-7 py-4 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </section>
  );
}
