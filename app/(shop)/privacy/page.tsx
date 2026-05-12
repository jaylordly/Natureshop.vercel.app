export const metadata = {
  title: '개인정보처리방침',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <section className="container-narrow py-16 max-w-3xl">
      <div className="mb-10">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Privacy</p>
        <h1 className="font-serif text-4xl">개인정보처리방침</h1>
        <p className="text-xs text-ink/50 mt-2">시행일: 2026년 1월 1일</p>
      </div>

      <div className="prose-policy text-sm leading-relaxed text-ink/80 space-y-8">
        <section>
          <h2 className="font-serif text-lg text-ink mb-2">1. 수집하는 개인정보 항목</h2>
          <p>The Nature Academy(이하 &quot;회사&quot;)는 회원가입, 상담, 서비스 제공 등을 위해 다음과 같은 정보를 수집합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
            <li>필수: 이메일, 비밀번호(암호화 저장), 이름</li>
            <li>선택: 휴대전화번호, 배송지 주소</li>
            <li>자동수집: 접속 IP, 쿠키, 방문 일시, 서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">2. 개인정보 수집 및 이용 목적</h2>
          <ul className="list-disc list-inside space-y-1 text-ink/70">
            <li>회원 식별 및 본인 확인</li>
            <li>상품 주문, 결제, 배송, 환불 처리</li>
            <li>고객 문의 응대, 공지사항 전달</li>
            <li>서비스 개선을 위한 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">3. 개인정보 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시 즉시 파기되며, 다음의 경우 관계 법령에 따라 보관됩니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
            <li>계약 및 청약 철회 기록: 5년 (전자상거래법)</li>
            <li>대금결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 및 분쟁처리 기록: 3년 (전자상거래법)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">4. 개인정보 제3자 제공</h2>
          <p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
            <li>이용자가 사전 동의한 경우</li>
            <li>법령에 따라 수사 목적으로 요구되는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">5. 개인정보 처리 위탁</h2>
          <p>원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
            <li>Supabase (회원 인증 및 데이터 저장)</li>
            <li>토스페이먼츠 (결제 처리)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">6. 이용자의 권리</h2>
          <p>이용자는 언제든지 본인의 개인정보를 조회, 수정, 삭제할 수 있으며, 마이페이지 또는 고객센터를 통해 요청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-serif text-lg text-ink mb-2">7. 개인정보 보호책임자</h2>
          <p>이메일: privacy@thenatureacademy.example</p>
        </section>
      </div>
    </section>
  );
}
