import { supabase, isSupabaseConfigured } from './supabase';
import type { Role } from './types';

export interface Customer {
  id: string;
  name: string;
  role: Role;
  createdAt: number;
  orderCount: number;
  totalSpent: number;
}

export async function listCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return [];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, role, created_at')
    .order('created_at', { ascending: false });
  if (error || !profiles) {
    console.error('[customers] list failed:', error);
    return [];
  }
  // 주문 카운트는 orders 테이블에서 집계 (RLS: 관리자라 다 보임)
  const { data: orders } = await supabase
    .from('orders')
    .select('user_id, total, status');
  const map = new Map<string, { count: number; spent: number }>();
  for (const o of orders ?? []) {
    if (o.status !== 'paid' && o.status !== 'demo') continue;
    const cur = map.get(o.user_id) ?? { count: 0, spent: 0 };
    map.set(o.user_id, { count: cur.count + 1, spent: cur.spent + (o.total as number) });
  }
  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role as Role,
    createdAt: new Date(p.created_at).getTime(),
    orderCount: map.get(p.id)?.count ?? 0,
    totalSpent: map.get(p.id)?.spent ?? 0,
  }));
}

export async function updateCustomerRole(id: string, role: Role): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
