import { supabase, isSupabaseConfigured } from './supabase';

export type ReturnType = 'refund' | 'exchange';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  type: ReturnType;
  reason: string;
  detail?: string;
  status: ReturnStatus;
  adminNote?: string;
  createdAt: number;
  resolvedAt?: number;
}

type Row = {
  id: string;
  order_id: string;
  user_id: string;
  type: ReturnType;
  reason: string;
  detail: string | null;
  status: ReturnStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

function toReturn(r: Row): ReturnRequest {
  return {
    id: r.id,
    orderId: r.order_id,
    userId: r.user_id,
    type: r.type,
    reason: r.reason,
    detail: r.detail ?? undefined,
    status: r.status,
    adminNote: r.admin_note ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
    resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : undefined,
  };
}

export const RETURN_REASONS = [
  '단순 변심',
  '상품 불량/파손',
  '오배송 (다른 상품)',
  '상품 설명과 다름',
  '배송 지연',
  '기타',
] as const;

/** 고객이 자기 주문에 대해 반품/교환 요청 생성 (RLS: 본인 + 자기 주문). */
export async function createReturnRequest(input: {
  orderId: string;
  type: ReturnType;
  reason: string;
  detail?: string;
}): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('returns').insert({
    order_id: input.orderId,
    user_id: session.user.id,
    type: input.type,
    reason: input.reason,
    detail: input.detail || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

/** 특정 주문의 (본인) 반품 요청 — 가장 최근 1건. */
export async function getReturnByOrder(orderId: string): Promise<ReturnRequest | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return toReturn(data);
}

/** 관리자: 전체 반품 요청 목록 (선택적 상태 필터). */
export async function listAllReturns(status?: ReturnStatus): Promise<ReturnRequest[]> {
  if (!isSupabaseConfigured) return [];
  let q = supabase.from('returns').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map(toReturn);
}

/** 관리자: 반품 상태 변경 (RLS: admin). */
export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  adminNote?: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
  const patch: Record<string, unknown> = { status };
  if (adminNote !== undefined) patch.admin_note = adminNote || null;
  if (status === 'approved' || status === 'rejected' || status === 'completed') {
    patch.resolved_at = new Date().toISOString();
  }
  const { error } = await supabase.from('returns').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
