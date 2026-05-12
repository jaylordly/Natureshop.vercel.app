import { supabase, isSupabaseConfigured } from './supabase';

export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase 미설정' };
  const { error } = await supabase.from('newsletter_subscribers').insert({ email });
  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { ok: false, error: '이미 구독된 이메일입니다.' };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: number;
  unsubscribedAt: number | null;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    subscribedAt: new Date(r.subscribed_at).getTime(),
    unsubscribedAt: r.unsubscribed_at ? new Date(r.unsubscribed_at).getTime() : null,
  }));
}
