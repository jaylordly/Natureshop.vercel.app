import { supabase, isSupabaseConfigured } from './supabase';

export type FaqCategory = 'general' | 'order' | 'payment' | 'shipping' | 'product';

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  sortOrder: number;
  active: boolean;
}

type Row = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  sort_order: number;
  active: boolean;
};

function toFaq(r: Row): Faq {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    category: r.category,
    sortOrder: r.sort_order,
    active: r.active,
  };
}

export async function listActiveFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('faqs').select('*').order('sort_order').order('created_at');
  return (data ?? []).map(toFaq);
}

export async function listAllFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('faqs').select('*').order('sort_order').order('created_at');
  return (data ?? []).map(toFaq);
}

export async function createFaq(input: { question: string; answer: string; category: FaqCategory; sortOrder?: number }) {
  const { error } = await supabase.from('faqs').insert({
    question: input.question,
    answer: input.answer,
    category: input.category,
    sort_order: input.sortOrder ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function updateFaq(id: string, patch: Partial<{ active: boolean; sortOrder: number; question: string; answer: string }>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.active !== undefined) dbPatch.active = patch.active;
  if (patch.sortOrder !== undefined) dbPatch.sort_order = patch.sortOrder;
  if (patch.question !== undefined) dbPatch.question = patch.question;
  if (patch.answer !== undefined) dbPatch.answer = patch.answer;
  const { error } = await supabase.from('faqs').update(dbPatch).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
