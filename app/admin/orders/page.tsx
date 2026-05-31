'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Download } from 'lucide-react';
import { listOrdersFromDb, type DbOrder } from '@/lib/orders';
import { STATUS_LABEL, STATUS_BADGE } from '@/lib/status-style';
import { carrierName } from '@/lib/shipping';
import { TableRowSkeleton } from '@/components/Skeleton';

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'paid', label: '결제완료' },
  { value: 'pending', label: '대기' },
  { value: 'failed', label: '실패' },
  { value: 'demo', label: '데모' },
] as const;

type Filter = (typeof FILTER_OPTIONS)[number]['value'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await listOrdersFromDb();
      setOrders(all);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const exportCsv = () => {
    const header = ['주문번호', '상태', '받는사람', '연락처', '배송지', '결제수단', '결제금액', '택배사', '송장번호', '주문일시', '상품'];
    const rows = filtered.map((o) => [
      o.id,
      STATUS_LABEL[o.status],
      o.shipping.name,
      o.shipping.phone,
      o.shipping.address,
      o.paymentMethod ?? '',
      o.total,
      carrierName(o.carrier),
      o.trackingNumber ?? '',
      new Date(o.createdAt).toISOString(),
      o.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => {
          const s = String(cell ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(','),
      )
      .join('\n');
    // BOM 추가 — Excel 한글 깨짐 방지
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Orders</p>
          <h1 className="font-serif text-3xl">주문 관리</h1>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 border border-gold/40 px-4 py-2.5 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" /> CSV 내보내기 ({filtered.length}건)
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.value === 'all' ? orders.length : orders.filter((o) => o.status === opt.value).length;
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs tracking-shop border transition ${
                active
                  ? 'bg-ink text-beige border-ink'
                  : 'border-gold/40 hover:bg-ink/5'
              }`}
            >
              {opt.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">주문번호</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden sm:table-cell">고객</th>
                <th className="text-left px-3 sm:px-5 py-3">상태</th>
                <th className="text-right px-3 sm:px-5 py-3">금액</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden md:table-cell">시각</th>
                <th className="text-right px-3 sm:px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}
                </>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-ink/40">{filter === 'all' ? '주문이 없습니다.' : '해당 상태의 주문이 없습니다.'}</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="border-t border-gold/15 hover:bg-beige/20 transition">
                    <td className="px-3 sm:px-5 py-3 font-mono text-xs">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-gold transition">
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">{o.shipping.name}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${STATUS_BADGE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">₩{o.total.toLocaleString()}</td>
                    <td className="px-3 sm:px-5 py-3 text-right text-ink/50 text-xs hidden md:table-cell">{fmt(o.createdAt)}</td>
                    <td className="px-3 sm:px-5 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-0.5 text-xs text-ink/70 hover:text-gold transition"
                      >
                        상세 <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
