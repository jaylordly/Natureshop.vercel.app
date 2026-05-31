import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase-admin';
import { sendOrderConfirmation, sendDepositPending } from '@/lib/email';

/**
 * 주문 확인/입금 안내 이메일 발송 (주문 생성 직후 호출).
 *
 * idempotent: confirmation_emailed_at 가 비어 있을 때만 보내고 스탬프를 찍는다.
 * (새로고침/중복 호출 시 1회만 발송)
 * 이메일 미설정 환경에서는 lib/email이 graceful 스킵.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ ok: false, error: 'orderId 필요' }, { status: 400 });

    const admin = getServiceClient();
    if (!admin) return NextResponse.json({ ok: true, skipped: 'unconfigured' });

    // 아직 메일 안 보낸 주문만 선점 (idempotent)
    const { data: claimed } = await admin
      .from('orders')
      .update({ confirmation_emailed_at: new Date().toISOString() })
      .eq('id', orderId)
      .is('confirmation_emailed_at', null)
      .select('id, user_id, total, status, vbank, vbank_due')
      .maybeSingle();

    if (!claimed) return NextResponse.json({ ok: true, skipped: 'already sent or not found' });

    if (claimed.status === 'pending') {
      await sendDepositPending({
        userId: claimed.user_id,
        orderId,
        total: claimed.total,
        vbank: claimed.vbank
          ? { bank: claimed.vbank.bank, accountNumber: claimed.vbank.accountNumber, dueDate: claimed.vbank_due ?? claimed.vbank.dueDate }
          : null,
      });
    } else if (claimed.status === 'paid') {
      await sendOrderConfirmation({ userId: claimed.user_id, orderId, total: claimed.total });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[orders/notify] error:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
