import { NextRequest, NextResponse } from 'next/server';
import { getServerSecretKey, type TossConfirmResponse } from '@/lib/payments/toss';
import { getServiceClient } from '@/lib/supabase-admin';

/**
 * TossPayments 결제 승인 — 클라이언트가 successUrl로 돌아오면 호출.
 *
 * 위변조 방지:
 *  1) 반드시 서버에서 secret key로 confirm을 호출 (secret 노출 방지)
 *  2) 클라이언트가 보낸 `amount`를 신뢰하지 않고, 주문 항목(items)을 DB의
 *     실제 상품 가격 + 서버측 쿠폰 검증으로 재계산해 일치할 때만 confirm.
 *     (안 하면 ₩100,000 장바구니를 ₩100로 결제하는 금액 위변조가 가능)
 *
 * 검증을 통과한 권위 있는 가격(items별 price_at_purchase, total)을 응답에 담아
 * 호출부가 주문 저장에 그대로 사용하도록 한다.
 */

interface ConfirmItem {
  productId: string;
  quantity: number;
}

interface PricedItem {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

/** 쿠폰 1건을 서버에서 재검증해 할인액 계산. 무효면 0. (validate_coupon RPC와 동일 로직) */
async function computeDiscount(
  admin: NonNullable<ReturnType<typeof getServiceClient>>,
  code: string | null | undefined,
  subtotal: number,
): Promise<number> {
  if (!code) return 0;
  const { data: c } = await admin
    .from('coupons')
    .select('type, value, min_order_amount, max_uses, used_count, active, expires_at')
    .eq('code', code)
    .maybeSingle();
  if (!c || !c.active) return 0;
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return 0;
  if (c.max_uses != null && c.used_count >= c.max_uses) return 0;
  if (subtotal < c.min_order_amount) return 0;
  if (c.type === 'fixed') return Math.min(c.value, subtotal);
  return Math.floor((subtotal * c.value) / 100);
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, items, couponCode } = await req.json();

    if (!paymentKey || !orderId || typeof amount !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'paymentKey, orderId, amount가 필요합니다.' },
        { status: 400 },
      );
    }

    // ── 서버측 금액 검증 ─────────────────────────────────────────
    // Supabase가 설정된 경우(라이브)에는 반드시 검증한다.
    // 미설정 데모 환경에서만 검증을 생략(graceful fallback)한다.
    const admin = getServiceClient();
    let pricing: { items: PricedItem[]; subtotal: number; discount: number; total: number } | null = null;

    if (admin) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { ok: false, error: '주문 항목이 필요합니다.' },
          { status: 400 },
        );
      }

      const reqItems: ConfirmItem[] = items.map((i: ConfirmItem) => ({
        productId: String(i.productId),
        quantity: Number(i.quantity),
      }));
      if (reqItems.some((i) => !i.productId || !Number.isInteger(i.quantity) || i.quantity <= 0)) {
        return NextResponse.json(
          { ok: false, error: '주문 항목 형식이 올바르지 않습니다.' },
          { status: 400 },
        );
      }

      const ids = [...new Set(reqItems.map((i) => i.productId))];
      const { data: products, error: prodErr } = await admin
        .from('products')
        .select('id, price')
        .in('id', ids);
      if (prodErr) {
        console.error('[/api/payments/confirm] 상품 조회 실패:', prodErr);
        return NextResponse.json({ ok: false, error: '상품 정보를 확인할 수 없습니다.' }, { status: 500 });
      }
      const priceMap = new Map<string, number>((products ?? []).map((p) => [p.id, p.price]));

      const pricedItems: PricedItem[] = [];
      for (const it of reqItems) {
        const price = priceMap.get(it.productId);
        if (price == null) {
          return NextResponse.json(
            { ok: false, error: `존재하지 않는 상품입니다: ${it.productId}` },
            { status: 400 },
          );
        }
        pricedItems.push({ productId: it.productId, quantity: it.quantity, priceAtPurchase: price });
      }

      const subtotal = pricedItems.reduce((s, i) => s + i.priceAtPurchase * i.quantity, 0);
      const discount = await computeDiscount(admin, couponCode, subtotal);
      const total = Math.max(0, subtotal - discount);

      if (total !== amount) {
        console.warn(
          `[/api/payments/confirm] 금액 불일치 — 요청 ${amount}, 서버 계산 ${total} (order ${orderId})`,
        );
        return NextResponse.json(
          { ok: false, error: '결제 금액이 주문 내역과 일치하지 않습니다.' },
          { status: 400 },
        );
      }

      pricing = { items: pricedItems, subtotal, discount, total };
    }

    // ── Toss 승인 ────────────────────────────────────────────────
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
    return NextResponse.json({ ok: true, payment: payload, pricing });
  } catch (err) {
    console.error('[/api/payments/confirm] 처리 중 오류:', err);
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
