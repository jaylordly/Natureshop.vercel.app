import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-admin';
import { getServerSecretKey } from '@/lib/payments/toss';
import { sendDepositConfirmed } from '@/lib/email';

/**
 * TossPayments 웹훅 — 주로 가상계좌 입금/취소 비동기 통지.
 *
 * 보안: 웹훅 본문을 신뢰하지 않는다. orderId/paymentKey만 추출해
 *       Toss API로 결제를 **재조회**하고 권위 있는 status로 판단한다.
 * idempotency: orders 상태 전이를 조건부 update(eq status)로 처리해
 *              중복 이벤트가 와도 한 번만 반영된다.
 *
 * Toss 대시보드 > 웹훅에 https://<도메인>/api/webhooks/toss 등록 필요.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.data ?? body ?? {};
    const orderId: string | undefined = data.orderId;
    const bodyPaymentKey: string | undefined = data.paymentKey;

    if (!orderId && !bodyPaymentKey) {
      return NextResponse.json({ ok: true, ignored: 'no identifier' });
    }

    const admin = getServiceClient();
    if (!admin) return NextResponse.json({ ok: true, skipped: 'unconfigured' });

    // 주문 조회 (paymentKey 보강 + 현재 상태/유저)
    let order: { id: string; status: string; payment_key: string | null; user_id: string; total: number } | null = null;
    if (orderId) {
      const { data: o } = await admin
        .from('orders')
        .select('id, status, payment_key, user_id, total')
        .eq('id', orderId)
        .maybeSingle();
      order = o ?? null;
    }
    const paymentKey = bodyPaymentKey || order?.payment_key || null;

    // Toss 재조회 (권위 있는 상태)
    const secret = getServerSecretKey();
    const auth = Buffer.from(`${secret}:`).toString('base64');
    const lookupUrl = paymentKey
      ? `https://api.tosspayments.com/v1/payments/${paymentKey}`
      : `https://api.tosspayments.com/v1/payments/orders/${orderId}`;
    const res = await fetch(lookupUrl, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      console.error('[webhook/toss] 결제 재조회 실패:', res.status);
      // 200을 주되 처리는 보류 (Toss가 재시도)
      return NextResponse.json({ ok: false, error: 'lookup failed' }, { status: 200 });
    }
    const payment = await res.json();
    const status: string = payment.status;
    const resolvedOrderId: string = order?.id ?? payment.orderId ?? orderId;

    if (!resolvedOrderId) return NextResponse.json({ ok: true, ignored: 'no order' });

    // 입금 완료 → pending에서만 paid로 전이 (idempotent)
    if (status === 'DONE') {
      const { data: updated } = await admin
        .from('orders')
        .update({
          status: 'paid',
          payment_method: payment.method ?? null,
          receipt_url: payment.receipt?.url ?? null,
        })
        .eq('id', resolvedOrderId)
        .eq('status', 'pending')
        .select('id, user_id, total')
        .maybeSingle();

      if (updated) {
        await admin.from('activity_log').insert({
          action: 'order.deposit_confirmed',
          target_type: 'order',
          target_id: resolvedOrderId,
          details: { amount: updated.total },
        });
        await sendDepositConfirmed({ userId: updated.user_id, orderId: resolvedOrderId, total: updated.total });
      }
      return NextResponse.json({ ok: true });
    }

    // 입금 기한 만료/취소 → pending에서만 failed로 전이 + 재고 복원
    if (['CANCELED', 'EXPIRED', 'ABORTED'].includes(status)) {
      const { data: failed } = await admin
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', resolvedOrderId)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle();
      if (failed) {
        await admin.rpc('restock_order', { p_order_id: resolvedOrderId });
        await admin.from('activity_log').insert({
          action: 'order.deposit_expired',
          target_type: 'order',
          target_id: resolvedOrderId,
          details: { status },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // 그 외(WAITING_FOR_DEPOSIT 등) 무시
    return NextResponse.json({ ok: true, ignored: status });
  } catch (err) {
    console.error('[webhook/toss] error:', err);
    // 200으로 응답해 Toss 폭주 재시도를 막되 로그로 추적
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
