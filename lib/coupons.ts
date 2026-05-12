import { supabase, isSupabaseConfigured } from './supabase';

export type CouponType = 'fixed' | 'percent';

export interface Coupon {
  code: string;
  label: string | null;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: number | null;
  createdAt: number;
}

type Row = {
  code: string;
  label: string | null;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

function toCoupon(r: Row): Coupon {
  return {
    code: r.code,
    label: r.label,
    type: r.type,
    value: r.value,
    minOrderAmount: r.min_order_amount,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    active: r.active,
    expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toCoupon);
}

export async function createCoupon(input: {
  code: string;
  label?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxUses?: number | null;
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('coupons').insert({
    code: input.code,
    label: input.label || null,
    type: input.type,
    value: input.value,
    min_order_amount: input.minOrderAmount ?? 0,
    max_uses: input.maxUses ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function toggleCoupon(code: string, active: boolean) {
  const { error } = await supabase.from('coupons').update({ active }).eq('code', code);
  return { ok: !error, error: error?.message ?? null };
}

export async function deleteCoupon(code: string) {
  const { error } = await supabase.from('coupons').delete().eq('code', code);
  return { ok: !error, error: error?.message ?? null };
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string }> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_code: code, p_subtotal: subtotal });
  if (error) return { valid: false, discount: 0, message: error.message };
  // RPC returns table — array of single row
  const row = Array.isArray(data) ? data[0] : data;
  return {
    valid: row?.valid ?? false,
    discount: row?.discount ?? 0,
    message: row?.message ?? '',
  };
}
