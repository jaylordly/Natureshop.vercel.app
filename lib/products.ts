import type { Product } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const PRODUCTS: Product[] = [
  {
    id: 'p-001',
    name: '디지털 머신 — Signature',
    description: '정밀한 진동수와 안정적인 토크. 장시간 시술에도 손목 부담을 최소화한 시그니처 디지털 머신.',
    price: 1,
    stock: 8,
    category: '머신',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
    isBest: true,
  },
  {
    id: 'p-002',
    name: '로터리 머신 — Pro',
    description: '저소음 로터리 모터. 디테일 작업에 최적화된 무게 밸런스.',
    price: 1,
    stock: 5,
    category: '머신',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
    isNew: true,
  },
  {
    id: 'p-003',
    name: '엠보 펜 — Classic',
    description: '경량 알루미늄 바디. 손에 자연스럽게 감기는 그립.',
    price: 1,
    stock: 40,
    category: '엠보',
    image: 'https://placehold.co/900x900/F6EFE6/B5894A?font=playfair&text=Embo+Pen',
    visibility: 'public',
    isBest: true,
  },
  {
    id: 'p-004',
    name: '엠보 블레이드 — 18U',
    description: '18핀 U타입 블레이드. 자연스러운 결을 표현하기 좋은 모델.',
    price: 1,
    stock: 200,
    category: '엠보',
    image: 'https://placehold.co/900x900/F6EFE6/8C6633?font=playfair&text=18U+Blade',
    visibility: 'public',
  },
  {
    id: 'p-005',
    name: '눈썹 색소 — Warm Brown',
    description: '웜톤 베이스. 시술 후 자연스러운 발색이 오래 유지됩니다.',
    price: 1,
    stock: 60,
    category: '색소',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
    isNew: true,
  },
  {
    id: 'p-006',
    name: '입술 색소 — Coral',
    description: '쿨톤·웜톤 모두 어울리는 코랄 베이스 입술 전용 색소.',
    price: 1,
    stock: 35,
    category: '색소',
    image: 'https://placehold.co/900x900/FBF7F0/A55C5C?font=playfair&text=Lip+Coral',
    visibility: 'student',
  },
  {
    id: 'p-007',
    name: '디스포저블 니들 — 1RL',
    description: '개별 멸균 포장. 라운드 라이너 1RL, 한 박스 50개입.',
    price: 1,
    stock: 120,
    category: '위생',
    image: 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
  },
  {
    id: 'p-008',
    name: '멸균 트레이 세트',
    description: '시술 전 위생 세팅을 위한 일회용 트레이 세트.',
    price: 1,
    stock: 300,
    category: '위생',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
  },
  {
    id: 'p-009',
    name: '애프터 케어 밤',
    description: '시술 직후 진정과 보호. 자극이 적은 성분으로 구성.',
    price: 1,
    stock: 80,
    category: '케어',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80&auto=format&fit=crop',
    visibility: 'public',
    isBest: true,
  },
  {
    id: 'p-010',
    name: '리페어 세럼 — 14일 케어',
    description: '시술 부위 회복을 돕는 14일 케어 세럼. 수강생 전용 추천 제품.',
    price: 1,
    stock: 25,
    category: '케어',
    image: 'https://placehold.co/900x900/FBF7F0/B5894A?font=playfair&text=Repair+Serum',
    visibility: 'student',
    isNew: true,
  },
  {
    id: 'p-011',
    name: '프로용 마스터 키트 (관리자 전용)',
    description: '내부 운영용 마스터 키트입니다.',
    price: 1,
    stock: 3,
    category: '머신',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80&auto=format&fit=crop',
    visibility: 'admin',
  },
];

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getBestProducts(): Product[] {
  return PRODUCTS.filter((p) => p.isBest);
}

export function getNewProducts(): Product[] {
  return PRODUCTS.filter((p) => p.isNew);
}

// ─────────────────────────────────────────────
// Supabase 버전 (서버 컴포넌트용 — async)
// ─────────────────────────────────────────────
function fromRow(row: {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  category: Product['category'];
  image: string;
  visibility: Product['visibility'];
  is_best: boolean;
  is_new: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    category: row.category,
    image: row.image,
    visibility: row.visibility,
    isBest: row.is_best,
    isNew: row.is_new,
  };
}

export async function getAllProductsFromDb(): Promise<Product[]> {
  if (!isSupabaseConfigured) return PRODUCTS;
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error || !data) {
    console.error('[products] supabase error:', error);
    return PRODUCTS;
  }
  return data.map(fromRow);
}

export async function getProductByIdFromDb(id: string): Promise<Product | undefined> {
  if (!isSupabaseConfigured) return PRODUCTS.find((p) => p.id === id);
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error || !data) return PRODUCTS.find((p) => p.id === id);
  return fromRow(data);
}

export async function getBestProductsFromDb(): Promise<Product[]> {
  const all = await getAllProductsFromDb();
  return all.filter((p) => p.isBest);
}

export async function getNewProductsFromDb(): Promise<Product[]> {
  const all = await getAllProductsFromDb();
  return all.filter((p) => p.isNew);
}

// ─────────────────────────────────────────────
// 관리자용 CRUD (RLS가 admin 전용으로 제한)
// ─────────────────────────────────────────────

export async function upsertProductInDb(product: Product): Promise<{ ok: boolean; error: string | null }> {
  const payload = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    original_price: product.originalPrice ?? null,
    stock: product.stock,
    category: product.category,
    image: product.image,
    visibility: product.visibility,
    is_best: product.isBest ?? false,
    is_new: product.isNew ?? false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('products').upsert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteProductFromDb(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
