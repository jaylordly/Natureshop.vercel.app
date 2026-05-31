'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Receipt, ExternalLink, RotateCcw, Truck } from 'lucide-react';
import { getOrderFromDb, updateOrderStatusInDb, type DbOrder } from '@/lib/orders';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import type { OrderStatus } from '@/lib/status-style';
import { STATUS_LABEL, STATUS_BADGE } from '@/lib/status-style';
import { CARRIERS } from '@/lib/shipping';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '입금 대기' },
  { value: 'paid', label: '결제 완료' },
  { value: 'failed', label: '결제 실패' },
  { value: 'demo', label: '데모' },
  { value: 'refunded', label: '환불됨' },
];

const FULFILLMENT_STEPS: { value: 'preparing' | 'shipped' | 'delivered'; label: string }[] = [
  { value: 'preparing', label: '배송 준비' },
  { value: 'shipped', label: '발송' },
  { value: 'delivered', label: '배송 완료' },
];

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [order, setOrder] = useState<DbOrder | null | undefined>(undefined);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [busy, setBusy] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const o = await getOrderFromDb(id);
      setOrder(o);
      if (o) {
        setNewStatus(o.status);
        setCarrier(o.carrier ?? '');
        setTracking(o.trackingNumber ?? '');
      }
    })();
  }, [id]);

  const handleFulfillment = async (status: 'preparing' | 'shipped' | 'delivered') => {
    if (!order) return;
    if (status === 'shipped' && (!carrier || !tracking.trim())) {
      show('발송 처리 시 택배사와 송장번호를 입력해 주세요.', 'error');
      return;
    }
    setFulfilling(status);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setFulfilling(null);
      show('로그인 세션이 필요합니다.', 'error');
      return;
    }
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ orderId: order.id, status, carrier: carrier || undefined, trackingNumber: tracking.trim() || undefined }),
    });
    const data = await res.json();
    setFulfilling(null);
    if (!data.ok) {
      show(`처리 실패: ${data.error}`, 'error');
      return;
    }
    setOrder({ ...order, status, carrier: carrier || undefined, trackingNumber: tracking.trim() || undefined });
    setNewStatus(status);
    show(`'${STATUS_LABEL[status]}'(으)로 변경했습니다. 고객 이메일을 발송했습니다.`, 'success');
  };

  const handleSave = async () => {
    if (!order || newStatus === order.status) return;
    setBusy(true);
    setMsg(null);
    const { ok, error } = await updateOrderStatusInDb(order.id, newStatus);
    setBusy(false);
    if (!ok) {
      setMsg({ kind: 'err', text: error || '상태 변경에 실패했습니다.' });
      return;
    }
    setOrder({ ...order, status: newStatus });
    setMsg({ kind: 'ok', text: '상태를 변경했습니다.' });
  };

  const handleRefund = async () => {
    if (!order) return;
    const reason = prompt('환불 사유를 입력해 주세요 (선택)');
    if (reason === null) return; // cancelled
    if (!confirm(`주문 ${order.id}을(를) 환불하시겠어요? 이 작업은 되돌릴 수 없습니다.`)) return;

    setRefunding(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setRefunding(false);
      show('로그인 세션이 필요합니다.', 'error');
      return;
    }

    const res = await fetch('/api/payments/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderId: order.id, cancelReason: reason || undefined }),
    });
    const data = await res.json();
    setRefunding(false);
    if (!data.ok) {
      show(`환불 실패: ${data.error}`, 'error');
      return;
    }
    setOrder({ ...order, status: 'refunded' });
    setNewStatus('refunded');
    show('환불 처리 완료', 'success');
  };

  if (order === undefined) {
    return <section className="container-narrow py-10 text-ink/40">불러오는 중...</section>;
  }
  if (order === null) {
    return (
      <section className="container-narrow py-10">
        <p className="text-ink/60">주문을 찾을 수 없습니다.</p>
        <Link href="/admin/orders" className="text-gold underline">주문 목록으로</Link>
      </section>
    );
  }

  return (
    <section className="container-narrow py-10 max-w-3xl">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-gold transition mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> 주문 목록
      </Link>
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Order Detail</p>
        <h1 className="font-serif text-3xl break-all">{order.id}</h1>
      </div>

      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg">상태 관리</h2>
          <span className={`inline-block px-3 py-1 text-[10px] tracking-shop uppercase ${STATUS_BADGE[order.status]}`}>
            현재: {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">새 상태로 변경</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full bg-beige border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:border-gold"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || newStatus === order.status}
            className="flex items-center gap-2 bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> {busy ? '저장 중...' : '저장'}
          </button>
        </div>
        {msg && (
          <p className={`text-xs mt-3 ${msg.kind === 'ok' ? 'text-gold-dark' : 'text-red-600'}`}>{msg.text}</p>
        )}

        {order.status === 'paid' && order.paymentKey && (
          <div className="border-t border-divider mt-5 pt-5">
            <p className="text-[11px] tracking-shop uppercase text-ink/50 mb-2">결제 환불</p>
            <p className="text-xs text-ink/60 mb-3">Toss에 환불 요청을 보내고 주문 상태를 환불됨으로 변경합니다. 재고가 자동 복원됩니다.</p>
            <button
              type="button"
              onClick={handleRefund}
              disabled={refunding}
              className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 text-xs tracking-shop hover:bg-red-50 transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {refunding ? '환불 처리 중...' : '환불 처리'}
            </button>
          </div>
        )}
      </div>

      {/* 배송 처리 — 결제완료/배송단계에서만 노출 */}
      {['paid', 'preparing', 'shipped', 'delivered'].includes(order.status) && (
        <div className="bg-card border border-gold/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-gold-dark" />
            <h2 className="font-serif text-lg">배송 처리</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">택배사</label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full bg-beige border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:border-gold"
              >
                <option value="">선택</option>
                {CARRIERS.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">송장번호</label>
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="숫자만 입력"
                className="w-full bg-beige border border-gold/30 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FULFILLMENT_STEPS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleFulfillment(s.value)}
                disabled={fulfilling !== null || order.status === s.value}
                className="border border-gold/40 px-4 py-2 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40"
              >
                {fulfilling === s.value ? '처리 중…' : s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink/50 mt-3">상태 변경 시 고객에게 이메일이 발송됩니다(이메일 미설정 시 자동 생략).</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-gold/30 p-6">
          <h2 className="font-serif text-lg mb-4">결제 정보</h2>
          <dl className="text-sm space-y-2">
            <Row k="결제 수단" v={order.paymentMethod || (order.status === 'demo' ? '데모' : '—')} />
            <Row k="결제 일시" v={fmt(order.createdAt)} />
            <Row k="결제 금액" v={`₩${order.total.toLocaleString()}`} bold />
            {order.paymentKey && <Row k="결제 키" v={order.paymentKey} mono />}
          </dl>
          {order.receiptUrl && (
            <a
              href={order.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 border border-gold/40 px-3 py-2 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition"
            >
              <Receipt className="w-3.5 h-3.5" /> 영수증 <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="bg-card border border-gold/30 p-6">
          <h2 className="font-serif text-lg mb-4">배송 정보</h2>
          <dl className="text-sm space-y-2">
            <Row k="받는 사람" v={order.shipping.name} />
            <Row k="연락처" v={order.shipping.phone} />
            <Row k="배송지" v={order.shipping.address} />
          </dl>
        </div>
      </div>

      <div className="bg-card border border-gold/30 p-6">
        <h2 className="font-serif text-lg mb-4">주문 상품 ({order.items.length}건)</h2>
        <div className="space-y-3 text-sm">
          {order.items.map((i) => (
            <div key={i.productId} className="flex justify-between gap-3">
              <span className="text-ink/80">
                <span className="font-mono text-xs text-ink/40 mr-2">{i.productId}</span>
                {i.productName} × {i.quantity}
              </span>
              <span className="whitespace-nowrap">₩{(i.priceAtPurchase * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {order.discountAmount > 0 && (
          <div className="border-t border-gold/10 mt-3 pt-2 flex justify-between text-sm text-gold-dark">
            <span>쿠폰 할인{order.couponCode && ` (${order.couponCode})`}</span>
            <span>-₩{order.discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-gold/20 mt-4 pt-4 flex justify-between font-serif">
          <span>합계</span>
          <span>₩{order.total.toLocaleString()}</span>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, bold, mono }: { k: string; v: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex">
      <dt className="w-24 text-ink/60 shrink-0">{k}</dt>
      <dd className={`${bold ? 'font-medium' : ''} ${mono ? 'font-mono text-xs break-all text-ink/70' : ''}`}>{v}</dd>
    </div>
  );
}
