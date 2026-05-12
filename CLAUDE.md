# The Nature Academy — 반영구 시술 전문 쇼핑몰

Next.js 14 App Router 기반 데모 쇼핑몰 + Brow Studio 마이크로사이트.

## 스택

- **Framework**: Next.js 14.2.x (App Router) + TypeScript strict
- **Styling**: Tailwind CSS 3 (커스텀 토큰: `gold/beige/ink/card/cream/divider/espresso`, Brow 전용 팔레트는 인라인 hex)
- **Fonts**: Noto Sans KR + Playfair Display (next/font/google)
- **Icons**: lucide-react (`optimizePackageImports`로 트리쉐이킹)
- **Charts**: recharts
- **Payments**: TossPayments v2 SDK (`@tosspayments/tosspayments-sdk`)
- **Face detection**: @vladmandic/face-api (모델은 `public/models/`)
- **경로 alias**: `@/*` → `./*`

## 라우트 구조

```
app/
  (shop)/       — 홈, 상품, 장바구니, 결제, 주문 (Header/Footer 공유)
    page.tsx                  /
    products/page.tsx         /products
    products/[id]/            /products/[id]   (generateMetadata + JSON-LD Product schema)
    cart/page.tsx             /cart
    checkout/page.tsx         /checkout         (Toss 위젯 임베드)
    checkout/success/         /checkout/success (서버 confirm 콜백)
    checkout/fail/            /checkout/fail
    orders/[id]/page.tsx      /orders/[id]      (결제 정보 + 영수증 링크)
  (auth)/login/page.tsx       /login            (3-tab: 일반/수강생/관리자 + 데모 버튼)
  admin/                      /admin/*          (AdminGuard 보호)
    page.tsx                  대시보드 (StatsCards · VisitorChart · RevenueChart · OrdersTable · ActivityFeed)
    settings/page.tsx         자격증명 관리
  brow/                       /brow/*           (별도 sub-brand)
    page.tsx, layout.tsx
    portfolio/page.tsx
    simulation/page.tsx       face-api + 캔버스 합성 + 디버그 오버레이
  api/payments/confirm/route.ts  /api/payments/confirm  (서버측 Toss 승인)
  sitemap.ts, robots.ts, opengraph-image.tsx
  icon.svg, apple-icon.svg
```

## 데이터 레이어 (현재 = localStorage)

| 키 | 모듈 | 비고 |
|---|---|---|
| `tna.auth.v1` | components/AuthProvider | user 정보 |
| `tna.cart.v1` | components/CartProvider | 장바구니 |
| `tna.orders.v1` | lib/orders | 주문 (status: paid/pending/failed/demo) |
| `tna.admin.creds.v1` | lib/credentials | 관리자 ID/PW (디폴트 admin/admin123) |
| `tna.student.code.v1` | lib/credentials | 수강생 코드 (디폴트 STUDENT2026) |
| `tna.pending-order.<id>` | sessionStorage | Toss redirect 사이 임시 저장 |

**향후 Supabase 이전 예정** — database/backend agent 협업.

## 환경변수 (모두 옵셔널 — 미설정 시 데모 모드)

`.env.local.example` 참고. 핵심:
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` — 미설정 시 Toss 게스트 테스트 키 사용
- `NEXT_PUBLIC_TOSS_DISABLED=1` — 결제 위젯 끄고 800ms 시뮬 데모
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL`, `NEXT_PUBLIC_KAKAO_CHAT_API` — 카카오 연동 (선택)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — 자리만 있음
- `NEXT_PUBLIC_SITE_URL` — sitemap/OG 절대경로 (미설정 시 localhost:3000)

## 서브에이전트 (`.claude/agents/`)

| Agent | Model | 영역 |
|---|---|---|
| frontend | sonnet | 고객용 UI · Tailwind · 모바일 반응형 |
| backend | sonnet | Route Handlers · lib/ · middleware · 서버 env |
| database | sonnet | Supabase 스키마 · RLS · 마이그레이션 |
| admin | sonnet | /admin/* · 차트 · 분석 |
| payment | sonnet | TossPayments · 서버 confirm · 환불 |
| qa | haiku | 회귀 검증 · 빌드/타입체크 · 버그 발견 |
| design | **opus** | 브랜드 톤 · 타이포 위계 · 접근성 · 시각 일관성 |

오버라이드: 호출 시 `model: "opus"`로 일회성 업그레이드 가능.

## 자주 쓰는 명령

```bash
# 의존성 설치 — ~/.npm 캐시 권한 문제 우회
npm install --cache /tmp/npm-cache-shop

# 개발 서버
PORT=3000 npx next dev

# 타입체크 (가장 자주)
npx tsc --noEmit

# 라우트 점검
for path in / /products /cart /checkout /admin /brow/simulation; do
  /usr/bin/curl -s -o /dev/null -w "%-25s %s\n" "$path" $(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
done
```

## 함정 (실제로 만났던 것들)

- **`next build`를 dev 서버 떠 있을 때 돌리면 .next/가 production으로 덮어써져 dev hot-reload 깨짐** → 빌드 검증 시 dev 끄기 → 빌드 → 다시 dev.
- **외부 SVG 이미지** → next.config.mjs에 `dangerouslyAllowSVG: true` + 안전 CSP 필요 (placehold.co가 SVG 응답).
- **face-api `Critical dependency` 경고** → Node/Browser 자동 감지용 dynamic require. 무해, 빌드/실행 정상.
- **`useSearchParams` 사용 컴포넌트는 반드시 `<Suspense>`로 감싸야 함** (Next.js prerender 요구).
- **localStorage** SSR 충돌 방지 — `'use client'` + `typeof window !== 'undefined'` 가드.
- **Toss confirm은 idempotent 아님** — 같은 paymentKey로 두 번 confirm 시 두 번째 에러. 새로고침 안내.

## 진행 상황 / 다음 단계

**완료**: 초기 복구 / 정적 자산 / face-api 통합 / 결제 시스템 (Toss v2) / orders/[id] 결제 정보 / Admin 실데이터 연동 / 모바일 반응형 / 7개 서브에이전트 / SEO (sitemap/robots/OG/JSON-LD) / 디자인 polish

**다음 권장 작업 (B — Supabase 연동)**:
- Supabase 프로젝트 생성 후 URL·anon key·service role key 받기
- database agent에게 스키마 + RLS 정책 위임 (`supabase/migrations/`)
- backend agent에게 Auth + Server Components data fetch 이전 위임
- frontend agent에게 AuthProvider/CartProvider Supabase 연동 위임
- payment agent와 backend agent 협업으로 webhook 추가 검토
- qa agent로 회귀 검증

기타 위임 권고 잔여:
- **frontend**: 캔버스 칩 그룹 재배치
- **design**: 새 페이지 추가 시 비주얼 가이드라인 점검
