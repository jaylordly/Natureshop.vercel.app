'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { listAllReturns, updateReturnStatus, type ReturnRequest, type ReturnStatus } from '@/lib/returns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: '접수',
  approved: '승인',
  rejected: '반려',
  completed: '완료',
};
const STATUS_BADGE: Record<ReturnStatus, string> = {
  requested: 'bg-cream text-espresso border border-divider',
  approved: 'bg-gold/15 text-gold-dark border border-gold/30',
  rejected: 'bg-wine-dark/10 text-wine-dark border border-wine-dark/30',
  completed: 'bg-gold/20 text-gold-dark border border-gold/40',
};
const FILTERS: { value: ReturnStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'requested', label: '접수' },
  { value: 'approved', label: '승인' },
  { value: 'completed', label: '완료' },
  { value: 'rejected', label: '반려' },
];

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminReturnsPage() {
  const { show } = useToast();
  const [filter, setFilter] = useState<ReturnStatus | 'all'>('all');
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listAllReturns(filter === 'all' ? undefined : filter);
    setItems(list);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void refresh(); }, [refresh]);

  // 환불 승인: refund 타입은 Toss 환불 처리 후 완료, exchange는 승인 상태로
  const approve = async (r: ReturnRequest) => {
    setBusy(r.id);
    try {
      if (r.type === 'refund') {
        if (!confirm(`주문 ${r.orderId} 환불을 진행할까요? 결제가 취소되고 재고가 복원됩니다.`)) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { show('로그인 세션이 필요합니다.', 'error'); return; }
        const res = await fetch('/api/payments/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ orderId: r.orderId, cancelReason: `반품 승인: ${r.reason}` }),
        });
        const data = await res.json();
        if (!data.ok) { show(`환불 실패: ${data.error}`, 'error'); return; }
        await updateReturnStatus(r.id, 'completed');
        show('환불 완료 및 반품 처리됨', 'success');
      } else {
        await updateReturnStatus(r.id, 'approved');
        show('교환 요청을 승인했습니다.', 'success');
      }
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const reject = async (r: ReturnRequest) => {
    const note = prompt('반려 사유를 입력해 주세요 (선택)');
    if (note === null) return;
    setBusy(r.id);
    const { ok, error } = await updateReturnStatus(r.id, 'rejected', note || undefined);
    setBusy(null);
    if (!ok) { show(`처리 실패: ${error}`, 'error'); return; }
    show('반려 처리했습니다.', 'success');
    await refresh();
  };

  const complete = async (r: ReturnRequest) => {
    setBusy(r.id);
    const { ok, error } = await updateReturnStatus(r.id, 'completed');
    setBusy(null);
    if (!ok) { show(`처리 실패: ${error}`, 'error'); return; }
    show('완료 처리했습니다.', 'success');
    await refresh();
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-6">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Returns</p>
        <h1 className="font-serif text-3xl">반품 / 환불 요청</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs tracking-shop uppercase border transition ${filter === f.value ? 'border-gold bg-gold/10 text-gold-dark' : 'border-divider text-ink/60 hover:border-gold/40'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-gold/30 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-shop uppercase text-ink/50 border-b border-gold/20">
              <th className="px-3 sm:px-5 py-3">주문번호</th>
              <th className="px-3 sm:px-5 py-3">유형</th>
              <th className="px-3 sm:px-5 py-3 hidden sm:table-cell">사유</th>
              <th className="px-3 sm:px-5 py-3">상태</th>
              <th className="px-3 sm:px-5 py-3 hidden sm:table-cell">요청일</th>
              <th className="px-3 sm:px-5 py-3 text-right">처리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/40">불러오는 중…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/40">요청이 없습니다.</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-gold/10 last:border-0">
                  <td className="px-3 sm:px-5 py-3">
                    <Link href={`/admin/orders/${r.orderId}`} className="font-mono text-xs hover:text-gold inline-flex items-center gap-1">
                      {r.orderId} <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-3 sm:px-5 py-3">{r.type === 'refund' ? '환불' : '교환'}</td>
                  <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">
                    {r.reason}
                    {r.detail && <span className="block text-xs text-ink/50 truncate max-w-[220px]">{r.detail}</span>}
                  </td>
                  <td className="px-3 sm:px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-3 sm:px-5 py-3 hidden sm:table-cell text-ink/60">{fmt(r.createdAt)}</td>
                  <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">
                    {r.status === 'requested' && (
                      <span className="inline-flex gap-2">
                        <button onClick={() => approve(r)} disabled={busy === r.id} className="border border-gold/40 px-3 py-1.5 text-xs tracking-shop hover:bg-ink hover:text-beige transition disabled:opacity-40">
                          {busy === r.id ? '처리 중…' : '승인'}
                        </button>
                        <button onClick={() => reject(r)} disabled={busy === r.id} className="border border-red-300 text-red-600 px-3 py-1.5 text-xs tracking-shop hover:bg-red-50 transition disabled:opacity-40">
                          반려
                        </button>
                      </span>
                    )}
                    {r.status === 'approved' && r.type === 'exchange' && (
                      <button onClick={() => complete(r)} disabled={busy === r.id} className="border border-gold/40 px-3 py-1.5 text-xs tracking-shop hover:bg-ink hover:text-beige transition disabled:opacity-40">
                        완료 처리
                      </button>
                    )}
                    {(r.status === 'completed' || r.status === 'rejected') && (
                      <span className="text-xs text-ink/40">{r.adminNote || '—'}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
