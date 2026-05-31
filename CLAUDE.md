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
    orders/[id]/page.tsx      /orders/[id]      (결제정보·배송추적 타임라인·송장조회·가상계좌 입금안내·반품요청)
  (auth)/login/page.tsx       /login            (3-tab: 일반/수강생/관리자 + 데모 버튼)
  admin/                      /admin/*          (AdminGuard 보호)
    page.tsx                  대시보드 (StatsCards · LowStockAlert · VisitorChart · RevenueChart · ActivityFeed)
    orders/[id]/page.tsx      상태관리 + 배송처리(택배사·송장) + 환불
    returns/page.tsx          반품/환불 요청 승인·반려
    products/page.tsx         상품목록 + 일괄편집(가격%·공개범위)
    settings/page.tsx         자격증명 관리
  brow/                       /brow/*           (별도 sub-brand: page·portfolio·simulation)
  api/payments/confirm/route.ts   서버측 Toss 승인 + DB 금액 재검증
  api/payments/refund/route.ts    관리자 환불(원자적·idempotent) + 환불메일
  api/admin/orders/route.ts       (PATCH) 배송상태/송장 갱신 + 배송메일 (admin 인증)
  api/orders/notify/route.ts      주문확인/입금안내 메일 (idempotent)
  api/webhooks/toss/route.ts      가상계좌 입금/만료 통지 → pending→paid/failed (결제 재조회 검증)
  sitemap.ts, robots.ts, opengraph-image.tsx
```

## 데이터 레이어 (현재 = Supabase 우선, 일부 localStorage 잔존)

`.env.local`에 실제 Supabase URL·anon key·service role key가 설정돼 있어 **라이브 DB 경로가 기본 동작**한다 (`isSupabaseConfigured === true`). 마이그레이션 0001~0017 적용 완료. 미설정 환경에서만 데모/localStorage 폴백으로 떨어진다.

### 엔티티별 실제 저장소

| 엔티티 | 모듈 | 저장소 | 비고 |
|---|---|---|---|
| 상품 (조회/관리) | lib/products.ts | **Supabase** (`*FromDb`) | cart/checkout도 `components/useProductMap` 훅으로 DB 가격 사용(통일됨). 하드코딩 `PRODUCTS[]`는 폴백 |
| 주문 | lib/orders.ts | **Supabase** (`place_order` RPC) | 배송(tracking_number·carrier·shipped_at·delivered_at)·가상계좌(vbank·vbank_due) 필드 포함. 죽은 localStorage 경로 |
| 반품/교환 요청 | lib/returns.ts | **Supabase** `returns` | RLS 본인 생성/조회, 관리자 all. 승인 시 환불 라우트 호출 |
| 인증/세션 | components/AuthProvider | **Supabase Auth + profiles** (이메일/PW, Kakao OAuth) | `tna.auth.v1`은 데모 모드 폴백만 |
| 장바구니 | components/CartProvider | **하이브리드** | localStorage 상시 + 로그인 시 `cart_items` 동기화(merge-on-login) |
| 고객/리뷰/위시리스트/주소/쿠폰 | lib/customers·reviews·wishlist·addresses·coupons | **Supabase** | RLS 본인 한정 |
| 공지/FAQ/뉴스레터/상품이미지/재고이력 | lib/notices·faqs·newsletter·product-images | **Supabase** | |
| 수강생 코드 (관리) | lib/student-codes.ts | **Supabase** `student_codes` + `upgrade_to_student` RPC | |
| ⚠️ 관리자/수강생 자격증명 | lib/credentials.ts | **localStorage** | `tna.admin.creds.v1`(admin/admin123), `tna.student.code.v1`(STUDENT2026). DB(`profiles.role`·`student_codes`)와 **이중 진실 소스** — 유일하게 미이전 |
| Toss redirect 임시 | lib/orders.ts | **sessionStorage** | `tna.pending-order.<id>` |

**남은 이전 작업**: `lib/credentials.ts`만 localStorage에 남아 있다. admin role은 이미 `profiles.role`로 검증되므로, 자격증명 모듈을 제거하고 server-side role 관리로 통일 필요.

## 환경변수 (모두 옵셔널 — 미설정 시 데모 모드)

`.env.local.example` 참고. 핵심:
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` — 미설정 시 Toss 게스트 테스트 키 사용
- `NEXT_PUBLIC_TOSS_DISABLED=1` — 결제 위젯 끄고 800ms 시뮬 데모
- `NEXT_PUBLIC_KAKAO_CHANNEL_URL`, `NEXT_PUBLIC_KAKAO_CHAT_API` — 카카오 연동 (선택)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — **실제 값 설정됨** (라이브 DB). service role key는 서버 전용(`api/payments/refund`), 클라이언트 import 금지
- `NEXT_PUBLIC_SITE_URL` — sitemap/OG/이메일 링크 절대경로 (미설정 시 localhost:3000)
- `RESEND_API_KEY`, `EMAIL_FROM` — 트랜잭션 이메일(주문확인·배송·환불·입금안내). 미설정 시 `lib/email`이 자동 스킵
- Toss 웹훅: Toss 대시보드에 `https://<도메인>/api/webhooks/toss` 등록(가상계좌 입금통지). 시크릿 불필요 — 서버가 결제 재조회로 검증

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
- **Toss confirm은 idempotent 아님** — checkout/success가 confirm 전 `getOrderFromDb`로 기존 주문을 확인해 중복 confirm을 건너뛴다(새로고침 안전).
- **가상계좌**: 주문이 `pending`(stock 예약 차감)으로 생성 → 입금 시 웹훅이 `paid`, 만료 시 `failed`+재고복원. `orders_update_own` 제거됐으므로 vbank 정보는 `place_order` 인자로 저장(클라 update 불가).

## 진행 상황 / 다음 단계

**완료**: 초기 복구 / 정적 자산 / face-api 통합 / 결제 시스템 (Toss v2) / orders/[id] 결제 정보 / Admin 실데이터 연동 / 모바일 반응형 / 7개 서브에이전트 / SEO (sitemap/robots/OG/JSON-LD) / 디자인 polish / **Supabase 이전 (마이그레이션 0001~0017, Auth·orders·cart·상품·리뷰 등 대부분 완료)**

**완료된 보안·정합성 작업** (2026-05):
- ✅ **결제 금액 서버 검증** — `api/payments/confirm`이 `items`로 DB 가격·쿠폰 재계산 후 `amount` 대조, 권위 가격 반환 (`lib/supabase-admin.ts` 추가)
- ✅ **`place_order` 서버 재계산** — `0018_place_order_recompute.sql`: client `p_total`/`p_discount`/`price_at_purchase` 무시, DB 가격·`validate_coupon`으로 재계산. 0007 10-arg 오버로드 drop
- ✅ **cart/checkout 화면 금액 DB 통일** — `components/useProductMap.ts` 훅으로 정적 배열(price=1) 대신 `getAllProductsFromDb`
- ✅ **환불 원자성·idempotency** — `0019_refund_atomicity.sql`: `refunding` 선점 상태 + `restock_order` RPC. route는 보상 트랜잭션 + Idempotency-Key
- ✅ **자기 주문 status self-update 차단** — `0020_drop_orders_update_own.sql`: `orders_update_own` 정책 제거. 사용자 UPDATE 경로 부재 확인, 관리자 변경은 `orders_update_admin`으로 유지

> ✅ **0018·0019·0020 라이브 적용·검증 완료** (service-role로 RPC·정책 확인).

**완료된 운영 기능 강화** (2026-05, 마이그레이션 `0021_operations.sql`):
- ✅ **주문/배송 추적 + 이메일 알림** — orders 배송/송장 필드, 상태 확장(preparing/shipped/delivered), `OrderStatusTimeline` 전체 단계, 고객 송장조회(`lib/shipping`), `api/admin/orders` PATCH(배송메일), `lib/email`(Resend, 옵션)
- ✅ **가상계좌(무통장) 결제** — confirm `WAITING_FOR_DEPOSIT` 분기로 `pending` 주문 생성, `api/webhooks/toss`가 입금확인→paid/만료→failed+재고복원
- ✅ **confirm idempotency** — 기존 주문 확인으로 새로고침 중복 confirm 방지
- ✅ **고객 반품/환불 요청** — `returns` 테이블, 주문상세 요청폼(`components/ReturnRequestSection`), `/admin/returns` 승인·반려(승인 시 환불 라우트 호출)
- ✅ **재고/상품 운영** — 품절·품절임박 뱃지(ProductCard), 관리자 일괄 가격%·공개범위 편집, stock_history reason 정확화(GUC)

> ⚠️ **`0021_operations.sql`은 라이브 DB에 아직 미적용** — 대시보드 SQL Editor 또는 `supabase db push`. `place_order`가 14-arg로 바뀌므로 0021이 12-arg를 drop 후 재생성.

**다음 권장 작업 (잔여)**:
- **`lib/credentials.ts` 제거** — localStorage 자격증명 → `profiles.role` 기반 server 관리로 통일, 데모-admin(`loginDemo('admin')`) 프로덕션 제거 (단, 데모 셸은 RLS가 데이터 차단하므로 실데이터 유출은 아님)
- **p-001~p-011 가격=1** → 관리자 상품편집(일괄 가격%)으로 실제값 설정 (데이터 작업)
- 이메일/가상계좌 라이브 검증은 RESEND_API_KEY 설정 + Toss 웹훅 등록 후 가능

기타 위임 권고 잔여:
- **frontend**: admin 리스트 페이지 중복 제거(`AdminPageHeader`/`AdminTable` 추출), `loading.tsx` 추가, `ProductCard` 내 `<button>`/`<a>` 중첩 수정
- **design**: 새 페이지 추가 시 비주얼 가이드라인 점검
