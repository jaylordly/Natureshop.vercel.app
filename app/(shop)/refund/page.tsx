export const metadata = {
  title: '교환·환불 정책',
  alternates: { canonical: '/refund' },
};

export default function RefundPage() {
  return (
    <section className="container-narrow py-16 max-w-3xl">
      <div className="mb-10">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Refund</p>
        <h1 className="font-serif text-4xl">교환·환불 정책</h1>
      </div>

      <div className="text-sm leading-relaxed text-ink/80 space-y-8">
        <section>
          <h2 className="font-serif text-lg text-ink mb-2">1. 교환·환불 신청 기간</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li><strong>단순 변심:</strong> 상품 수령일로부터 7일 이내</li>
            <li><strong>상품 하자/오배송:</strong> 수령일로부터 30일 이내, 또는 그 사실을 안 날로부터 30일 이내</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">2. 교환·환불 불가 사항</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li>이용자의 책임으로 상품이 훼손된 경우</li>
            <li>포장을 개봉했거나 사용한 위생용품, 일회용품 (니들, 블레이드 등)</li>
            <li>이용자의 사용 또는 일부 소비로 상품 가치가 현저히 감소한 경우</li>
            <li>시간의 경과로 재판매가 곤란한 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">3. 환불 처리</h2>
          <p>환불은 결제 시 사용한 동일한 수단으로 진행됩니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
            <li>카드 결제: 카드사 정책에 따라 3~7 영업일 소요</li>
            <li>계좌이체: 환불 승인 후 1~3 영업일 내 입금</li>
            <li>간편결제: 결제 수단에 따라 즉시 ~ 5 영업일</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">4. 배송비 부담</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li>단순 변심: 이용자 부담</li>
            <li>상품 하자/오배송: 회사 부담</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">5. 교환·환불 신청 방법</h2>
          <p>고객센터 또는 카카오톡 채널을 통해 주문번호와 함께 신청해 주시기 바랍니다.</p>
        </section>
      </div>
    </section>
  );
}
