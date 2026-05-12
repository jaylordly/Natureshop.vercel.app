import { NextRequest, NextResponse } from 'next/server';
import { getServerSecretKey, type TossConfirmResponse } from '@/lib/payments/toss';

/**
 * TossPayments 결제 승인 — 클라이언트가 successUrl로 돌아오면 호출.
 *
 * 위변조 방지를 위해 반드시 서버에서 secret key로 confirm을 호출해야 합니다.
 * (클라이언트에서 직접 confirm하면 secret이 노출됨)
 */
export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || typeof amount !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'paymentKey, orderId, amount가 필요합니다.' },
        { status: 400 },
      );
    }

    const secret = getServerSecretKey();
    const auth = Buffer.from(`${secret}:`).toString('base64');

    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data.message || 'Toss 승인 실패', code: data.code, raw: data },
        { status: res.status },
      );
    }

    const payload: TossConfirmResponse = data;
    return NextResponse.json({ ok: true, payment: payload });
  } catch (err) {
    console.error('[/api/payments/confirm] 처리 중 오류:', err);
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
