import { supabase, isSupabaseConfigured } from './supabase';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

type Row = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
};

function toImage(r: Row): ProductImage {
  return { id: r.id, productId: r.product_id, url: r.url, sortOrder: r.sort_order };
}

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
    .order('created_at');
  return (data ?? []).map(toImage);
}

export async function addProductImage(productId: string, url: string, sortOrder: number = 0) {
  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url,
    sort_order: sortOrder,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteProductImage(id: string) {
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function updateImageOrder(id: string, sortOrder: number) {
  const { error } = await supabase.from('product_images').update({ sort_order: sortOrder }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
