'use client';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { useAuth } from '@/components/AuthProvider';
import { getProductById } from '@/lib/products';
import { createOrderInDb, newOrderId, setPendingOrder } from '@/lib/orders';
import { listAddresses, type Address } from '@/lib/addresses';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TOSS_CLIENT_KEY, TOSS_ENABLED, isUsingTestKey } from '@/lib/payments/toss';
import { Eyebrow } from '@/components/Eyebrow';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { validateCoupon } from '@/lib/coupons';
import { Ticket, MapPin } from 'lucide-react';

type WidgetsHandle = Awaited<ReturnType<NonNullable<TossPaymentsApi>['widgets']>>;
type TossPaymentsApi = Awaited<ReturnType<typeof import('@tosspayments/tosspayments-sdk').loadTossPayments>>;

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('010-0000-0000');
  const [address, setAddress] = useState('서울시 강남구 테헤란로 123');
  const [submitting, setSubmitting] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  // 쿠폰
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // 저장된 주소록
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  useEffect(() => {
    if (!user || user.id.startsWith('demo-')) return;
    (async () => {
      const list = await listAddresses();
      setAddresses(list);
      const def = list.find((a) => a.isDefault) ?? list[0];
      if (def) {
        setSelectedAddressId(def.id);
        setName(def.name);
        setPhone(def.phone);
        setAddress(def.address);
      }
    })();
  }, [user]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') return;
    const a = addresses.find((x) => x.id === id);
    if (a) {
      setName(a.name);
      setPhone(a.phone);
      setAddress(a.address);
    }
  };

  const widgetsRef = useRef<WidgetsHandle | null>(null);

  const cartProducts = items
    .map((i) => ({ item: i, product: getProductById(i.productId)! }))
    .filter((x) => x.product);
  const subtotal = cartProducts.reduce((s, { item, product }) => s + item.quantity * product.price, 0);
  const shipping = 0;
  const discount = couponApplied?.discount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    const result = await validateCoupon(couponCode.trim().toUpperCase(), subtotal);
    setCouponBusy(false);
    if (!result.valid) {
      setCouponApplied(null);
      setCouponMsg({ kind: 'err', text: result.message });
      return;
    }
    setCouponApplied({ code: couponCode.trim().toUpperCase(), discount: result.discount });
    setCouponMsg({ kind: 'ok', text: `₩${result.discount.toLocaleString()} 할인 적용` });
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponMsg(null);
  };

  // Toss 결제위젯 초기화
  useEffect(() => {
    if (!TOSS_ENABLED || items.length === 0 || total <= 0) return;
    let cancelled = false;
    setWidgetError(null);
    setWidgetReady(false);

    (async () => {
      try {
        const { loadTossPayments, ANONYMOUS } = await import('@tosspayments/tosspayments-sdk');
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        if (cancelled) return;
        const customerKey = user?.id || ANONYMOUS;
        const widgets = tossPayments.widgets({ customerKey });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: 'KRW', value: total });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-methods', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        if (!cancelled) setWidgetReady(true);
      } catch (err) {
        console.error('[checkout] Toss 위젯 초기화 실패:', err);
        if (!cancelled) setWidgetError('결제 위젯을 불러오지 못했습니다.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // total/items가 바뀌면 다시 초기화
  }, [items.length, total, user?.id]);

  // 금액이 바뀌면 위젯에 동기화 (수량 변경 등)
  useEffect(() => {
    if (!widgetReady || !widgetsRef.current) return;
    void widgetsRef.current.setAmount({ currency: 'KRW', value: total });
  }, [total, widgetReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;

    if (!user || user.id.startsWith('demo-')) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    if (!TOSS_ENABLED) {
      // 데모 모드 — 기존 800ms 시뮬레이션 + DB 저장
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 800));
      const { order, error } = await createOrderInDb({
        userId: user.id,
        items: cartProducts.map(({ item, product }) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        })),
        total,
        shipping: { name, phone, address },
        status: 'demo',
        couponCode: couponApplied?.code,
        discount: couponApplied?.discount,
      });
      if (error || !order) {
        show(`주문 생성 실패: ${error ?? '알 수 없는 오류'}`, 'error');
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/orders/${order.id}`);
      return;
    }

    if (!widgetReady || !widgetsRef.current) return;
    setSubmitting(true);

    const orderId = newOrderId();
    setPendingOrder({
      orderId,
      items,
      total,
      shipping: { name, phone, address },
      createdAt: Date.now(),
      couponCode: couponApplied?.code,
      discount: couponApplied?.discount,
    });

    const orderName =
      cartProducts.length === 1
        ? cartProducts[0].product.name
        : `${cartProducts[0].product.name} 외 ${cartProducts.length - 1}건`;

    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerName: name,
        customerMobilePhone: phone.replace(/-/g, ''),
      });
      // requestPayment는 successUrl로 리다이렉트되므로 여기로 잘 안 옴
    } catch (err) {
      console.error('[checkout] requestPayment 실패:', err);
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="container-narrow py-24 text-center">
        <h1 className="font-serif text-3xl mb-4">장바구니가 비어있어요</h1>
        <Link href="/products" className="text-gold hover:underline">
          쇼핑하러 가기
        </Link>
      </section>
    );
  }

  return (
    <section className="container-narrow py-16">
      <Eyebrow text="Checkout" className="mb-7" />
      <h1 className="font-serif text-4xl sm:text-5xl mb-10 text-center tracking-tight">주문하기</h1>
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <h2 className="font-serif text-xl mb-6">배송 정보</h2>

          {addresses.length > 0 && (
            <div className="mb-5">
              <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 저장된 주소
              </label>
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex items-start gap-3 p-3 border cursor-pointer transition ${selectedAddressId === a.id ? 'border-gold bg-gold/5' : 'border-divider hover:border-gold/40'}`}>
                    <input
                      type="radio"
                      name="addr"
                      checked={selectedAddressId === a.id}
                      onChange={() => handleAddressSelect(a.id)}
                      className="accent-ink mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] tracking-shop uppercase bg-beige px-1.5 py-0.5 border border-gold/30">{a.label}</span>
                        {a.isDefault && <span className="text-[9px] tracking-shop uppercase text-gold-dark">기본</span>}
                      </div>
                      <p className="text-sm">{a.name} · {a.phone}</p>
                      <p className="text-xs text-ink/60 truncate">{a.address}</p>
                    </div>
                  </label>
                ))}
                <label className={`flex items-start gap-3 p-3 border cursor-pointer transition ${selectedAddressId === 'new' ? 'border-gold bg-gold/5' : 'border-divider hover:border-gold/40'}`}>
                  <input
                    type="radio"
                    name="addr"
                    checked={selectedAddressId === 'new'}
                    onChange={() => handleAddressSelect('new')}
                    className="accent-ink mt-0.5"
                  />
                  <span className="text-sm text-ink/70">새 주소 직접 입력</span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Field label="받는 사람" value={name} onChange={setName} />
            <Field label="연락처" value={phone} onChange={setPhone} />
            <Field label="배송지" value={address} onChange={setAddress} />
          </div>
          {addresses.length === 0 && user && !user.id.startsWith('demo-') && (
            <p className="text-xs text-ink/50 mt-3">
              <Link href="/account/addresses" className="text-gold-dark hover:underline">주소록</Link>에 미리 저장해두면 빠르게 결제할 수 있어요.
            </p>
          )}

          <h2 className="font-serif text-xl mb-6 mt-12">결제 수단</h2>
          {TOSS_ENABLED ? (
            <>
              <div id="toss-payment-methods" className="min-h-[180px]" />
              <div id="toss-agreement" className="mt-2" />
              {!widgetReady && !widgetError && (
                <p className="text-xs text-ink/40 mt-4">결제 위젯 로딩 중…</p>
              )}
              {widgetError && (
                <p className="text-xs text-red-600 mt-4">{widgetError}</p>
              )}
              {isUsingTestKey() && (
                <div className="mt-4 border border-gold/30 bg-cream p-3 text-[11px] text-ink/60 leading-relaxed">
                  <p className="text-gold mb-1 tracking-shop uppercase">데모 모드</p>
                  Toss 공개 테스트 키를 사용 중입니다. 카드번호 <span className="font-mono">4330-1234-1234-1234</span>·임의 만료일·CVC로 결제 시뮬레이션이 가능합니다.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                {['카카오페이', '신용카드', '계좌이체'].map((m, i) => (
                  <label key={m} className="flex items-center gap-3 p-4 border border-gold/40 cursor-pointer hover:bg-ink/[0.02]">
                    <input type="radio" name="pay" defaultChecked={i === 0} className="accent-ink" />
                    <span className="text-sm">{m}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-ink/40 mt-4">데모 모드 — 실제 결제는 발생하지 않습니다</p>
            </>
          )}
        </div>

        <aside className="bg-card border border-gold/30 p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-serif text-xl mb-6">주문 요약</h2>
          <div className="space-y-3 mb-6 text-sm">
            {cartProducts.map(({ item, product }) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-ink/70">
                  {product.name} × {item.quantity}
                </span>
                <span>₩{(product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gold/30 pt-4 mb-4">
            <label className="block text-[10px] tracking-shop uppercase text-ink/50 mb-2">쿠폰 코드</label>
            {couponApplied ? (
              <div className="flex items-center justify-between gap-2 bg-gold/10 border border-gold/30 px-3 py-2.5">
                <span className="text-xs font-mono flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-gold-dark" /> {couponApplied.code}
                </span>
                <button type="button" onClick={handleRemoveCoupon} className="text-xs text-ink/60 hover:text-red-600 transition">해제</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="코드 입력"
                  className="flex-1 bg-beige border border-gold/30 px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponBusy || !couponCode.trim()}
                  className="border border-gold/40 px-3 py-2.5 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40"
                >
                  {couponBusy ? '확인 중' : '적용'}
                </button>
              </div>
            )}
            {couponMsg && (
              <p className={`text-[11px] mt-1.5 ${couponMsg.kind === 'ok' ? 'text-gold-dark' : 'text-red-600'}`}>
                {couponMsg.text}
              </p>
            )}
          </div>

          <div className="border-t border-gold/30 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">상품</span>
              <span>₩{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">배송비</span>
              <span>무료</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gold-dark">
                <span>쿠폰 할인</span>
                <span>-₩{discount.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gold/30 mt-4 pt-4 flex justify-between items-baseline">
            <span className="font-serif text-base tracking-wide text-ink/80">합계</span>
            <span className="font-serif text-3xl tracking-tight text-gold-dark">₩{total.toLocaleString()}</span>
          </div>
          <button
            disabled={submitting || (TOSS_ENABLED && !widgetReady)}
            type="submit"
            className="block w-full mt-6 bg-gold text-beige py-4 hover:bg-gold-soft hover:shadow-gold-glow transition-all tracking-cta uppercase text-xs font-medium disabled:opacity-50"
          >
            {submitting ? '결제 진행 중…' : TOSS_ENABLED ? '결제하기' : '주문하기'}
          </button>
        </aside>
      </form>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <TextField label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
        required
      />
    </TextField>
  );
}
