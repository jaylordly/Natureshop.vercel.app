import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSecretKey } from '@/lib/payments/toss';

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

    // 주문 조회
    const { data: order } = await admin
      .from('orders')
      .select('id, status, payment_key, total')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (order.status !== 'paid') {
      return NextResponse.json({ ok: false, error: `현재 상태(${order.status})에서는 환불할 수 없습니다.` }, { status: 400 });
    }
    if (!order.payment_key) {
      return NextResponse.json({ ok: false, error: 'paymentKey가 없는 주문입니다.' }, { status: 400 });
    }

    // Toss cancel 호출
    const secret = getServerSecretKey();
    const auth = Buffer.from(`${secret}:`).toString('base64');
    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${order.payment_key}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason: cancelReason || '관리자 환불 처리' }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) {
      return NextResponse.json(
        { ok: false, error: tossData.message || 'Toss 환불 실패', code: tossData.code },
        { status: tossRes.status },
      );
    }

    // orders 갱신
    await admin
      .from('orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId);

    // 재고 복원 (order_items 조회 후 각 상품 재고 +)
    // 환불 빈도가 낮으니 단순 read-then-write로 처리. 동시 환불 거의 없음.
    const { data: items } = await admin.from('order_items').select('product_id, quantity').eq('order_id', orderId);
    if (items) {
      for (const it of items) {
        const { data: p } = await admin.from('products').select('stock').eq('id', it.product_id).maybeSingle();
        if (p) await admin.from('products').update({ stock: p.stock + it.quantity }).eq('id', it.product_id);
      }
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

    return NextResponse.json({ ok: true, refundedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[refund] error:', err);
    return NextResponse.json({ ok: false, error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
