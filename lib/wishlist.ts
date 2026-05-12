import { supabase, isSupabaseConfigured } from './supabase';

export async function listWishlist(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', session.user.id);
  if (error || !data) return [];
  return data.map((r) => r.product_id);
}

export async function addToWishlist(productId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('wishlist_items').insert({ user_id: session.user.id, product_id: productId });
  if (error && !error.message.includes('duplicate')) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function removeFromWishlist(productId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('wishlist_items').delete().eq('user_id', session.user.id).eq('product_id', productId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
