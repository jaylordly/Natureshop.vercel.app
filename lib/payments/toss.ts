/**
 * TossPayments 결제 설정.
 *
 * 환경변수가 있으면 그 값을, 없으면 Toss가 공개 문서에 제공하는 게스트 테스트 키를 사용.
 * (https://docs.tosspayments.com/reference/test-card-and-account)
 *
 * 운영 전환:
 *   .env.local 에
 *     NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
 *     TOSS_SECRET_KEY=live_sk_...
 *   를 설정하면 자동으로 라이브 키 사용.
 */

const DEFAULT_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
const DEFAULT_SECRET_KEY = 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

export const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || DEFAULT_CLIENT_KEY;

export function getServerSecretKey(): string {
  return process.env.TOSS_SECRET_KEY || DEFAULT_SECRET_KEY;
}

/**
 * 결제 활성 여부.
 * NEXT_PUBLIC_TOSS_DISABLED=1 이면 데모 모드(800ms 시뮬레이션)로 fallback.
 * 기본은 활성 — 게스트 테스트 키로 즉시 시연 가능.
 */
export const TOSS_ENABLED =
  process.env.NEXT_PUBLIC_TOSS_DISABLED !== '1' && Boolean(TOSS_CLIENT_KEY);

export function isUsingTestKey(key: string = TOSS_CLIENT_KEY): boolean {
  return key.startsWith('test_');
}

export interface TossConfirmResponse {
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  status: string;
  method?: string;
  approvedAt?: string;
  receipt?: { url?: string };
  [k: string]: unknown;
}
