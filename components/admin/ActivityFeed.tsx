'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { listOrdersFromDb, type DbOrder } from '@/lib/orders';
import { relativeTime } from '@/lib/admin-analytics';
import { STATUS_DOT } from '@/lib/status-style';

function summarizeItems(o: DbOrder): string {
  if (o.items.length === 0) return '주문 항목 없음';
  const firstLabel = `${o.items[0].productName} ×${o.items[0].quantity}`;
  if (o.items.length === 1) return firstLabel;
  return `${firstLabel} 외 ${o.items.length - 1}건`;
}

export default function ActivityFeed() {
  const [orders, setOrders] = useState<DbOrder[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const real = await listOrdersFromDb();
      if (!cancelled) setOrders(real.slice(0, 7));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-card border border-gold/30 p-5 sm:p-6">
      <p className="text-[11px] tracking-shop uppercase text-ink/50 mb-4">최근 활동</p>
      {orders.length === 0 ? (
        <div className="py-10 text-center">
          <Activity className="w-6 h-6 text-ink/20 mx-auto mb-2" />
          <p className="text-sm text-ink/50 mb-1">최근 활동이 없어요</p>
          <p className="text-xs text-ink/40">결제가 완료되면 여기에 표시됩니다</p>
        </div>
      ) : (
        <ul className="divide-y divide-gold/15">
          {orders.map((o) => {
            const Icon = o.status === 'paid' ? CheckCircle2 : ShoppingBag;
            return (
              <li key={o.id} className="py-3 flex items-start gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-beige ${STATUS_DOT[o.status]}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0 flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-ink/80 truncate">
                      {o.status === 'paid' ? '결제완료' : o.status === 'demo' ? '데모 주문' : o.status === 'failed' ? '결제실패' : '대기'} —{' '}
                      <Link href={`/orders/${o.id}`} className="hover:text-gold transition">
                        {summarizeItems(o)}
                      </Link>
                    </p>
                    <p className="text-[11px] text-ink/40 font-mono">{o.id}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm">₩{o.total.toLocaleString()}</p>
                    <p className="text-xs text-ink/40">{relativeTime(o.createdAt)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
