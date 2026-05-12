-- ============================================================
-- RLS 정책 (Row Level Security)
-- "누가 어떤 행을 읽고/쓸 수 있는가" — DB 단에서 강제
-- ============================================================

-- 모든 테이블에 RLS 켜기
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;


-- ─────────────────────────────────────────────
-- 헬퍼: 현재 로그인 유저의 role 조회
-- ─────────────────────────────────────────────
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;


-- ─────────────────────────────────────────────
-- profiles 정책
-- ─────────────────────────────────────────────
-- 본인 프로필 조회
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- 관리자는 모두 조회
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.current_role() = 'admin');

-- 본인 프로필 수정 (role 제외 — role은 admin만)
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- 관리자는 모두 수정
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.current_role() = 'admin');


-- ─────────────────────────────────────────────
-- products 정책
-- ─────────────────────────────────────────────
-- public 상품은 누구나 조회 (비로그인 포함)
create policy "products_select_public"
  on public.products for select
  using (visibility = 'public');

-- student 상품은 수강생/관리자만
create policy "products_select_student"
  on public.products for select
  using (visibility = 'student' and public.current_role() in ('student', 'admin'));

-- admin 상품은 관리자만
create policy "products_select_admin"
  on public.products for select
  using (visibility = 'admin' and public.current_role() = 'admin');

-- 상품 추가/수정/삭제는 관리자만
create policy "products_insert_admin"
  on public.products for insert
  with check (public.current_role() = 'admin');

create policy "products_update_admin"
  on public.products for update
  using (public.current_role() = 'admin');

create policy "products_delete_admin"
  on public.products for delete
  using (public.current_role() = 'admin');


-- ─────────────────────────────────────────────
-- orders 정책
-- ─────────────────────────────────────────────
-- 본인 주문 조회
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

-- 관리자는 모든 주문 조회
create policy "orders_select_admin"
  on public.orders for select
  using (public.current_role() = 'admin');

-- 본인 주문 생성
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- 본인 주문 수정 (status 갱신용)
create policy "orders_update_own"
  on public.orders for update
  using (auth.uid() = user_id);

-- 관리자는 모든 주문 수정
create policy "orders_update_admin"
  on public.orders for update
  using (public.current_role() = 'admin');


-- ─────────────────────────────────────────────
-- order_items 정책
-- ─────────────────────────────────────────────
-- 자기 주문의 항목만 조회
create policy "order_items_select_own"
  on public.order_items for select
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));

-- 관리자는 모두 조회
create policy "order_items_select_admin"
  on public.order_items for select
  using (public.current_role() = 'admin');

-- 자기 주문의 항목 추가
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));
