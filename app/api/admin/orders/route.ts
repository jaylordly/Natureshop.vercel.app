import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-admin';
import { sendShippingUpdate } from '@/lib/email';

/**
 * 관리자 주문 처리 (배송 상태/송장 갱신 + 고객 이메일 발송).
 *
 * 이메일은 서버에서만 보낼 수 있으므로 상태 변경을 이 라우트로 모은다.
 * 인증: Bearer 토큰 → profiles.role='admin' 확인 (refund 라우트와 동일 패턴).
 */
const SHIPPING_STATUSES = ['preparing', 'shipped', 'delivered'] as const;
const ALLOWED_STATUSES = ['paid', 'preparing', 'shipped', 'delivered'] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status, trackingNumber, carrier } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId가 필요합니다.' }, { status: 400 });
    }
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: `허용되지 않은 상태: ${status}` }, { status: 400 });
    }

    const admin = getServiceClient();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Supabase가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 관리자 인증
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
    if (!token) return NextResponse.json({ ok: false, error: '로그인이 필요합니다.' }, { status: 401 });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ ok: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('role, name')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ ok: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 업데이트 페이로드 구성
    const patch: Record<string, unknown> = {};
    if (status) patch.status = status;
    if (trackingNumber !== undefined) patch.tracking_number = trackingNumber || null;
    if (carrier !== undefined) patch.carrier = carrier || null;
    if (status === 'shipped') patch.shipped_at = new Date().toISOString();
    if (status === 'delivered') patch.delivered_at = new Date().toISOString();
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: '변경할 내용이 없습니다.' }, { status: 400 });
    }

    const { data: updated, error: updErr } = await admin
      .from('orders')
      .update(patch)
      .eq('id', orderId)
      .select('id, user_id, total, status, tracking_number, carrier')
      .maybeSingle();
    if (updErr || !updated) {
      return NextResponse.json({ ok: false, error: updErr?.message ?? '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 활동 로그
    await admin.from('activity_log').insert({
      actor_id: userData.user.id,
      actor_name: profile.name,
      action: 'order.fulfillment',
      target_type: 'order',
      target_id: orderId,
      details: { status, trackingNumber, carrier },
    });

    // 배송 상태 변경 시 고객 이메일 (best-effort)
    if (status && (SHIPPING_STATUSES as readonly string[]).includes(status)) {
      await sendShippingUpdate({
        userId: updated.user_id,
        orderId,
        status: status as 'preparing' | 'shipped' | 'delivered',
        carrier: updated.carrier,
        trackingNumber: updated.tracking_number,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/orders PATCH] error:', err);
    return NextResponse.json({ ok: false, error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
