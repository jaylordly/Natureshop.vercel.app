import { supabase, isSupabaseConfigured } from './supabase';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  content: string;
  createdAt: number;
}

type Row = {
  id: string;
  user_id: string;
  user_name: string;
  product_id: string;
  rating: number;
  content: string;
  created_at: string;
};

function toReview(r: Row): Review {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    productId: r.product_id,
    rating: r.rating,
    content: r.content,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listReviewsForProduct(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toReview);
}

export async function createReview(input: { productId: string; rating: number; content: string; userName: string }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: '로그인이 필요합니다.' };
  const { error } = await supabase.from('reviews').insert({
    user_id: session.user.id,
    user_name: input.userName,
    product_id: input.productId,
    rating: input.rating,
    content: input.content,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
