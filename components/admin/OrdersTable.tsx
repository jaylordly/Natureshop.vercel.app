'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { listOrdersFromDb, type DbOrder } from '@/lib/orders';
import { STATUS_LABEL, STATUS_BADGE } from '@/lib/status-style';

const DEMO_FALLBACK: DbOrder[] = [
  {
    id: 'ORD-DEMO-A1',
    userId: 'demo',
    items: [{ productId: 'p-001', productName: '디지털 머신 — Signature', quantity: 1, priceAtPurchase: 850000 }],
    total: 850000,
    shipping: { name: '김지수', phone: '010-1234-5678', address: '서울시 강남구 …' },
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    status: 'paid',
    paymentMethod: '카드',
    discountAmount: 0,
  },
  {
    id: 'ORD-DEMO-A2',
    userId: 'demo',
    items: [
      { productId: 'p-005', productName: '눈썹 색소 — Warm Brown', quantity: 3, priceAtPurchase: 55000 },
      { productId: 'p-009', productName: '애프터 케어 밤', quantity: 2, priceAtPurchase: 22000 },
    ],
    total: 209000,
    shipping: { name: '박민호', phone: '010-2345-6789', address: '경기도 성남시 …' },
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    status: 'paid',
    paymentMethod: '카카오페이',
    discountAmount: 0,
  },
  {
    id: 'ORD-DEMO-A3',
    userId: 'demo',
    items: [{ productId: 'p-003', productName: '엠보 펜 — Classic', quantity: 5, priceAtPurchase: 38000 }],
    total: 190000,
    shipping: { name: '이수정', phone: '010-3456-7890', address: '부산시 해운대구 …' },
    createdAt: Date.now() - 1000 * 60 * 60 * 52,
    status: 'demo',
    discountAmount: 0,
  },
];


function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const real = await listOrdersFromDb();
      if (cancelled) return;
      if (real.length > 0) {
        setOrders(real.slice(0, 10));
        setUsingFallback(false);
      } else {
        setOrders(DEMO_FALLBACK);
        setUsingFallback(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-card border border-gold/30">
      <div className="px-6 py-5 border-b border-gold/30 flex items-center justify-between">
        <p className="text-[11px] tracking-shop uppercase text-ink/50">최근 주문</p>
        <Link href="/admin/orders" className="text-[11px] text-ink/60 hover:text-gold transition">
          전체 보기 →
        </Link>
      </div>

      {usingFallback && (
        <div className="px-5 py-3 border-b border-gold/20 bg-cream/60 flex items-start gap-2 text-[11px] text-ink/60 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
          <p>
            아직 실제 주문이 없어 데모 데이터를 표시하고 있어요. <Link href="/checkout" className="text-gold underline hover:text-gold-dark">/checkout</Link>에서 결제를 한 번 완료하시면 실데이터로 자동 전환됩니다.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
            <tr>
              <th className="text-left px-3 sm:px-5 py-3">주문번호</th>
              <th className="text-left px-3 sm:px-5 py-3 hidden sm:table-cell">고객</th>
              <th className="text-left px-3 sm:px-5 py-3 hidden md:table-cell">상품</th>
              <th className="text-left px-3 sm:px-5 py-3">상태</th>
              <th className="text-right px-3 sm:px-5 py-3">금액</th>
              <th className="text-right px-3 sm:px-5 py-3 hidden sm:table-cell">시각</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const summary = o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ');
              const idCell = usingFallback ? (
                <span>{o.id}</span>
              ) : (
                <Link href={`/admin/orders/${o.id}`} className="hover:text-gold transition">
                  {o.id}
                </Link>
              );
              return (
                <tr key={o.id} className="border-t border-gold/20">
                  <td className="px-3 sm:px-5 py-3 font-mono text-xs">
                    {idCell}
                    <span className="block sm:hidden text-[10px] text-ink/50 mt-0.5 font-sans">
                      {o.shipping.name} · {fmt(o.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">{o.shipping.name}</td>
                  <td className="px-3 sm:px-5 py-3 text-ink/70 max-w-[280px] truncate hidden md:table-cell">{summary}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${STATUS_BADGE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">₩{o.total.toLocaleString()}</td>
                  <td className="px-3 sm:px-5 py-3 text-right text-ink/50 text-xs hidden sm:table-cell">{fmt(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
