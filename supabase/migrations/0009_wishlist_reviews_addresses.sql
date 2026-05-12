-- ============================================================
-- 9: wishlist_items / reviews / addresses
-- ============================================================

-- ─── wishlist_items ─────────────────────────────
create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlist_user_id_idx on public.wishlist_items(user_id);

alter table public.wishlist_items enable row level security;

create policy "wishlist_select_own" on public.wishlist_items for select using (auth.uid() = user_id);
create policy "wishlist_insert_own" on public.wishlist_items for insert with check (auth.uid() = user_id);
create policy "wishlist_delete_own" on public.wishlist_items for delete using (auth.uid() = user_id);


-- ─── reviews ───────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  product_id text not null references public.products(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  created_at timestamptz not null default now()
);

create index reviews_product_id_idx on public.reviews(product_id, created_at desc);
create index reviews_user_id_idx on public.reviews(user_id);

alter table public.reviews enable row level security;

-- 누구나 읽음
create policy "reviews_select_all" on public.reviews for select using (true);

-- 본인이 구매한 상품만 작성 가능
create policy "reviews_insert_own_purchased" on public.reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.user_id = auth.uid()
        and o.status in ('paid', 'demo')
        and oi.product_id = reviews.product_id
    )
  );

-- 본인 리뷰 수정/삭제
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- 관리자 삭제
create policy "reviews_delete_admin" on public.reviews for delete using (public.current_role() = 'admin');


-- ─── addresses ─────────────────────────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,                       -- "집", "회사" 등
  name text not null,
  phone text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses(user_id);

alter table public.addresses enable row level security;

create policy "addresses_select_own" on public.addresses for select using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses for update using (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses for delete using (auth.uid() = user_id);

-- 새 기본 주소 설정 시 다른 주소들의 is_default를 false로
create or replace function public.handle_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.addresses set is_default = false
    where user_id = new.user_id and id != new.id;
  end if;
  return new;
end;
$$;

create trigger addresses_default_trigger
  after insert or update of is_default on public.addresses
  for each row when (new.is_default = true)
  execute function public.handle_default_address();
