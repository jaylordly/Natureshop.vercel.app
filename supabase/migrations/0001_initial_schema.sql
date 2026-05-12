-- ============================================================
-- The Nature Academy — 초기 스키마
-- 4개 테이블: profiles, products, orders, order_items
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. profiles — auth.users 확장 (이름/역할)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('user', 'student', 'admin')),
  created_at timestamptz not null default now()
);

-- 새 회원가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────
-- 2. products — 상품
-- ─────────────────────────────────────────────
create table public.products (
  id text primary key,                   -- 'p-001' 형식 유지
  name text not null,
  description text not null,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null check (category in ('머신', '엠보', '색소', '위생', '케어')),
  image text not null,
  visibility text not null default 'public' check (visibility in ('public', 'student', 'admin')),
  is_best boolean not null default false,
  is_new boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_visibility_idx on public.products(visibility);
create index products_category_idx on public.products(category);


-- ─────────────────────────────────────────────
-- 3. orders — 주문 (요약 / 헤더)
-- ─────────────────────────────────────────────
create table public.orders (
  id text primary key,                            -- 'ORD-XXX-YYY' 형식 유지
  user_id uuid not null references auth.users(id) on delete restrict,
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'demo')),
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  payment_key text,
  payment_method text,
  receipt_url text,
  created_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);


-- ─────────────────────────────────────────────
-- 4. order_items — 주문 상품 라인
-- ─────────────────────────────────────────────
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price_at_purchase integer not null check (price_at_purchase >= 0)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);
