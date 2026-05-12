-- ============================================================
-- product_images — 상품 이미지 갤러리 (cover 외 추가 이미지)
-- products.image은 cover로 유지, product_images에 추가 이미지
-- ============================================================

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

-- 누구나 조회 (상품 공개 정책은 products 테이블에서 처리)
create policy "product_images_select_all" on public.product_images for select using (true);

-- 관리자만 CRUD
create policy "product_images_admin_insert" on public.product_images for insert
  with check (public.current_role() = 'admin');
create policy "product_images_admin_update" on public.product_images for update
  using (public.current_role() = 'admin');
create policy "product_images_admin_delete" on public.product_images for delete
  using (public.current_role() = 'admin');
