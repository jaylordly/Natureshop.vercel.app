import { supabase, isSupabaseConfigured } from './supabase';

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
  createdAt: number;
}

type Row = {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  is_default: boolean;
  created_at: string;
};

function toAddress(r: Row): Address {
  return {
    id: r.id,
    label: r.label,
    name: r.name,
    phone: r.phone,
    address: r.address,
    isDefault: r.is_default,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', session.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toAddress);
}

export async function createAddress(input: { label: string; name: string; phone: string; address: string; isDefault?: boolean }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('addresses').insert({
    user_id: session.user.id,
    label: input.label,
    name: input.name,
    phone: input.phone,
    address: input.address,
    is_default: input.isDefault ?? false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function setDefaultAddress(id: string) {
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
