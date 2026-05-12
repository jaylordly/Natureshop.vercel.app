export const metadata = {
  title: '이용약관',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <section className="container-narrow py-16 max-w-3xl">
      <div className="mb-10">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Terms</p>
        <h1 className="font-serif text-4xl">이용약관</h1>
        <p className="text-xs text-ink/50 mt-2">시행일: 2026년 1월 1일</p>
      </div>

      <div className="text-sm leading-relaxed text-ink/80 space-y-8">
        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제1조 (목적)</h2>
          <p>본 약관은 The Nature Academy(이하 &quot;회사&quot;)가 운영하는 온라인 쇼핑몰에서 제공하는 상품 판매 및 부가 서비스의 이용과 관련하여 회사와 이용자의 권리·의무·책임 사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제2조 (용어의 정의)</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li>&quot;쇼핑몰&quot;: 회사가 운영하는 The Nature Academy 사이트</li>
            <li>&quot;이용자&quot;: 쇼핑몰에 접속하여 본 약관에 따라 서비스를 받는 회원 및 비회원</li>
            <li>&quot;회원&quot;: 본 사이트에 가입하여 ID와 비밀번호를 부여받은 이용자</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제3조 (약관의 효력 및 변경)</h2>
          <p>본 약관은 회원이 이용약관에 동의한 시점부터 효력이 발생합니다. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제4조 (회원가입)</h2>
          <p>이용자는 회사가 정한 양식에 따라 정보를 제공하고, 약관에 동의함으로써 회원가입을 신청합니다. 회사는 정보가 사실이 아니거나 필요한 사항을 기재하지 않은 경우 가입을 거절할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제5조 (서비스의 이용)</h2>
          <p>회사는 회원에게 상품 검색, 주문, 결제, 배송 추적, 리뷰 작성, 고객 지원 등의 서비스를 제공합니다. 회사는 시스템 점검, 천재지변, 운영상 필요한 경우 서비스 제공을 일시 중단할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제6조 (계약의 성립)</h2>
          <p>이용자가 주문 양식에 따라 상품 정보를 입력하고 결제를 완료한 시점에 매매계약이 성립합니다. 회사는 재고 부족, 가격 변동 등의 경우 주문을 취소할 수 있으며, 결제 금액을 환불합니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제7조 (회원의 의무)</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li>타인의 정보 도용 금지</li>
            <li>회사 운영 방해 행위 금지</li>
            <li>본 약관 및 관계 법령 준수</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">제8조 (책임의 제한)</h2>
          <p>회사는 천재지변, 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</p>
        </section>
      </div>
    </section>
  );
}
