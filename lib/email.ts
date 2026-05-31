/**
 * 트랜잭션 이메일 (Resend REST API, fetch 기반 — 별도 SDK 의존성 없음).
 *
 * RESEND_API_KEY / EMAIL_FROM 미설정 시 graceful 스킵({skipped:true}) —
 * 기존 Toss 데모 철학과 동일하게 "옵션 env"로 동작.
 *
 * 수신 이메일은 profiles에 없으므로 service-role auth.admin.getUserById로 조회한다.
 * 서버(Route Handler)에서만 호출할 것 — RESEND_API_KEY는 서버 전용.
 */
import { getServiceClient } from './supabase-admin';
import { carrierName, trackingUrl } from './shipping';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BRAND = 'The Nature Academy';

type SendResult = { skipped: true } | { ok: true } | { ok: false; error: string };

function emailConfig(): { key: string; from: string } | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return null;
  return { key, from };
}

async function getUserEmail(userId: string): Promise<string | null> {
  const admin = getServiceClient();
  if (!admin) return null;
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

function won(n: number): string {
  return `₩${(n ?? 0).toLocaleString()}`;
}

function layout(title: string, bodyHtml: string, orderId?: string): string {
  const cta = orderId
    ? `<a href="${SITE}/orders/${orderId}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1a1a1a;color:#f4ead9;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase">주문 상세 보기</a>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f4ead9;font-family:'Apple SD Gothic Neo',sans-serif;color:#1a1a1a">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#b5894a;margin:0 0 8px">${BRAND}</p>
    <h1 style="font-size:22px;font-weight:600;margin:0 0 20px">${title}</h1>
    <div style="font-size:14px;line-height:1.7;color:#3a3a3a">${bodyHtml}</div>
    ${cta}
    <p style="margin-top:32px;font-size:11px;color:#9a9a9a">본 메일은 발신 전용입니다.</p>
  </div></body></html>`;
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  const cfg = emailConfig();
  if (!cfg) return { skipped: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: cfg.from, to, subject, html }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('[email] Resend 실패:', res.status, t);
      return { ok: false, error: t };
    }
    return { ok: true };
  } catch (e) {
    console.error('[email] 전송 오류:', e);
    return { ok: false, error: String(e) };
  }
}

/** 수신자 이메일을 userId로 조회해 발송하는 공통 래퍼. 이메일 없으면 스킵. */
async function sendToUser(userId: string, subject: string, html: string): Promise<SendResult> {
  if (!emailConfig()) return { skipped: true };
  const to = await getUserEmail(userId);
  if (!to) return { skipped: true };
  return send(to, subject, html);
}

export async function sendOrderConfirmation(p: { userId: string; orderId: string; total: number }): Promise<SendResult> {
  return sendToUser(
    p.userId,
    `[${BRAND}] 주문이 접수되었습니다`,
    layout(
      '주문이 접수되었습니다',
      `주문번호 <strong>${p.orderId}</strong><br/>결제 금액 <strong>${won(p.total)}</strong><br/><br/>결제가 정상 처리되어 배송 준비를 시작합니다.`,
      p.orderId,
    ),
  );
}

export async function sendDepositConfirmed(p: { userId: string; orderId: string; total: number }): Promise<SendResult> {
  return sendToUser(
    p.userId,
    `[${BRAND}] 입금이 확인되었습니다`,
    layout(
      '입금이 확인되었습니다',
      `주문번호 <strong>${p.orderId}</strong><br/>입금 금액 <strong>${won(p.total)}</strong><br/><br/>가상계좌 입금이 확인되어 배송 준비를 시작합니다.`,
      p.orderId,
    ),
  );
}

export async function sendDepositPending(p: { userId: string; orderId: string; total: number; vbank?: { bank?: string; accountNumber?: string; dueDate?: string } | null }): Promise<SendResult> {
  const v = p.vbank;
  const acct = v
    ? `입금 계좌<br/><strong>${v.bank ?? ''} ${v.accountNumber ?? ''}</strong>${v.dueDate ? `<br/>입금 기한 ${new Date(v.dueDate).toLocaleString('ko-KR')}` : ''}<br/><br/>`
    : '';
  return sendToUser(
    p.userId,
    `[${BRAND}] 입금을 기다리고 있습니다`,
    layout(
      '입금 안내',
      `주문번호 <strong>${p.orderId}</strong><br/>입금 금액 <strong>${won(p.total)}</strong><br/><br/>${acct}기한 내 입금이 확인되면 배송이 시작됩니다.`,
      p.orderId,
    ),
  );
}

export async function sendShippingUpdate(p: {
  userId: string;
  orderId: string;
  status: 'preparing' | 'shipped' | 'delivered';
  carrier?: string | null;
  trackingNumber?: string | null;
}): Promise<SendResult> {
  const titleMap = { preparing: '배송 준비 중입니다', shipped: '상품이 발송되었습니다', delivered: '배송이 완료되었습니다' };
  const url = trackingUrl(p.carrier, p.trackingNumber);
  const track =
    p.status === 'shipped' && url
      ? `택배사 <strong>${carrierName(p.carrier)}</strong><br/>송장번호 <strong>${p.trackingNumber}</strong><br/><a href="${url}">배송 조회하기</a><br/><br/>`
      : '';
  return sendToUser(
    p.userId,
    `[${BRAND}] ${titleMap[p.status]}`,
    layout(titleMap[p.status], `주문번호 <strong>${p.orderId}</strong><br/><br/>${track}`, p.orderId),
  );
}

export async function sendRefundDone(p: { userId: string; orderId: string; total: number }): Promise<SendResult> {
  return sendToUser(
    p.userId,
    `[${BRAND}] 환불이 완료되었습니다`,
    layout(
      '환불이 완료되었습니다',
      `주문번호 <strong>${p.orderId}</strong><br/>환불 금액 <strong>${won(p.total)}</strong><br/><br/>환불은 카드사/은행에 따라 영업일 기준 3~5일 소요될 수 있습니다.`,
      p.orderId,
    ),
  );
}
