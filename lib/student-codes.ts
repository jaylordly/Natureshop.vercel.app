import { supabase, isSupabaseConfigured } from './supabase';

export interface StudentCode {
  code: string;
  label: string | null;
  active: boolean;
  usedCount: number;
  maxUses: number | null;
  createdAt: number;
  expiresAt: number | null;
}

type Row = {
  code: string;
  label: string | null;
  active: boolean;
  used_count: number;
  max_uses: number | null;
  created_at: string;
  expires_at: string | null;
};

function toCode(r: Row): StudentCode {
  return {
    code: r.code,
    label: r.label,
    active: r.active,
    usedCount: r.used_count,
    maxUses: r.max_uses,
    createdAt: new Date(r.created_at).getTime(),
    expiresAt: r.expires_at ? new Date(r.expires_at).getTime() : null,
  };
}

export async function listStudentCodes(): Promise<StudentCode[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('student_codes').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toCode);
}

export async function createStudentCode(input: {
  code: string;
  label?: string;
  maxUses?: number | null;
  expiresAt?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('student_codes').insert({
    code: input.code,
    label: input.label || null,
    max_uses: input.maxUses ?? null,
    expires_at: input.expiresAt ?? null,
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function toggleStudentCode(code: string, active: boolean): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('student_codes').update({ active }).eq('code', code);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteStudentCode(code: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('student_codes').delete().eq('code', code);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
