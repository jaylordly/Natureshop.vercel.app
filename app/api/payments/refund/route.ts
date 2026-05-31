import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSecretKey } from '@/lib/payments/toss';
import { sendRefundDone } from '@/lib/email';

/**
 * 결제 환불 (관리자 전용).
 *
 * 흐름:
 *   1) 호출자가 관리자인지 검증 (service role로 profiles 조회)
 *   2) orders 테이블에서 paymentKey + status='paid' 확인
 *   3) Toss /payments/{paymentKey}/cancel 호출
 *   4) 성공 시 orders.status='refunded', refunded_at 갱신
 *   5) activity_log에 기록
 *   6) 재고 복원
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, cancelReason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId가 필요합니다.' }, { status: 400 });
    }

    // 호출자 인증 (Bearer 토큰)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 토큰으로 유저 확인
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // 관리자 권한 확인
    const { data: profile } = await admin.from('profiles').select('role, name').eq('id', userData.user.id).maybeSingle();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ ok: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 주문 존재 여부 사전 확인 (친절한 에러 메시지용)
    const { data: order } = await admin
      .from('orders')
      .select('id, status, payment_key, total, user_id')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!order.payment_key) {
      return NextResponse.json({ ok: false, error: 'paymentKey가 없는 주문입니다.' }, { status: 400 });
    }

    // ── 환불 선점 (원자적 idempotency 가드) ──────────────────────
    // paid → refunding 전이에 성공한 호출만 실제 환불을 진행한다.
    // 동시 클릭 시 두 번째 호출은 0 rows를 받아 여기서 중단 → 이중 환불 방지.
    const { data: claimed } = await admin
      .from('orders')
      .update({ status: 'refunding' })
      .eq('id', orderId)
      .eq('status', 'paid')
      .select('id, payment_key, total');
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        { ok: false, error: `현재 상태(${order.status})에서는 환불할 수 없습니다. 이미 처리 중이거나 완료된 주문일 수 있습니다.` },
        { status: 409 },
      );
    }
    const paymentKey = claimed[0].payment_key as string;

    // Toss cancel 호출 (idempotency key로 동일 환불 재시도 안전)
    const secret = getServerSecretKey();
    const auth = Buffer.from(`${secret}:`).toString('base64');
    let tossRes: Response;
    try {
      tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `refund-${orderId}`,
        },
        body: JSON.stringify({ cancelReason: cancelReason || '관리자 환불 처리' }),
      });
    } catch (netErr) {
      // 네트워크 오류 — 선점 상태를 paid로 되돌려 재시도 가능하게
      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId).eq('status', 'refunding');
      throw netErr;
    }
    const tossData = await tossRes.json();
    if (!tossRes.ok) {
      // Toss 실패 — 보상 트랜잭션으로 paid 복원
      await admin.from('orders').update({ status: 'paid' }).eq('id', orderId).eq('status', 'refunding');
      return NextResponse.json(
        { ok: false, error: tossData.message || 'Toss 환불 실패', code: tossData.code },
        { status: tossRes.status },
      );
    }

    // refunding → refunded 확정
    await admin
      .from('orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId);

    // 재고 복원 — 단일 문 RPC로 원자 처리
    const { error: restockErr } = await admin.rpc('restock_order', { p_order_id: orderId });
    if (restockErr) {
      // 환불 자체는 성공했으므로 실패시켜선 안 됨. 로그만 남기고 진행.
      console.error('[refund] restock_order 실패:', restockErr);
    }

    // 활동 로그
    await admin.from('activity_log').insert({
      actor_id: userData.user.id,
      actor_name: profile.name,
      action: 'order.refund',
      target_type: 'order',
      target_id: orderId,
      details: { amount: order.total, reason: cancelReason || null },
    });

    // 고객 환불 완료 이메일 (best-effort)
    await sendRefundDone({ userId: order.user_id, orderId, total: order.total });

    return NextResponse.json({ ok: true, refundedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[refund] error:', err);
    return NextResponse.json({ ok: false, error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
