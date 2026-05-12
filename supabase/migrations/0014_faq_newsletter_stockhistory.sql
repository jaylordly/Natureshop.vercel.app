-- ============================================================
-- 14: FAQ + 뉴스레터 + 재고 변동 이력
-- ============================================================

-- ─── faqs ─────────────────────────────────────
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',         -- 'general', 'order', 'payment', 'shipping', 'product'
  sort_order integer not null default 0,            -- 낮을수록 위에 표시
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index faqs_active_idx on public.faqs(active, sort_order);

alter table public.faqs enable row level security;

create policy "faqs_select_active" on public.faqs for select using (active = true);
create policy "faqs_admin_all" on public.faqs for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');


-- ─── newsletter_subscribers ───────────────────
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;

-- 누구나 구독 가능 (이메일만 입력)
create policy "newsletter_anonymous_insert" on public.newsletter_subscribers for insert
  with check (true);

-- 관리자만 조회/삭제/수정
create policy "newsletter_admin_select" on public.newsletter_subscribers for select
  using (public.current_role() = 'admin');
create policy "newsletter_admin_update" on public.newsletter_subscribers for update
  using (public.current_role() = 'admin');
create policy "newsletter_admin_delete" on public.newsletter_subscribers for delete
  using (public.current_role() = 'admin');


-- ─── stock_history ────────────────────────────
create table public.stock_history (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  delta integer not null,                            -- 양수=입고, 음수=출고
  stock_after integer not null,
  reason text not null,                              -- 'sale', 'refund', 'manual', 'init'
  reference_id text,                                 -- order_id 등
  created_at timestamptz not null default now()
);

create index stock_history_product_idx on public.stock_history(product_id, created_at desc);

alter table public.stock_history enable row level security;

create policy "stock_history_admin_select" on public.stock_history for select
  using (public.current_role() = 'admin');
-- Insert는 트리거가 처리 (security definer)


-- ─── 트리거: products.stock 변경 자동 기록 ─────
create or replace function public.log_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
  v_reason text;
begin
  v_delta := new.stock - old.stock;
  if v_delta = 0 then return new; end if;

  -- 어떤 트랜잭션 컨텍스트인지 추정
  -- (실제로는 호출자가 명시적으로 stock_history에 넣는 게 좋지만 자동 로깅으로 시작)
  v_reason := 'manual';

  insert into public.stock_history (product_id, delta, stock_after, reason)
  values (new.id, v_delta, new.stock, v_reason);

  return new;
end;
$$;

create trigger products_stock_history
  after update of stock on public.products
  for each row
  when (old.stock is distinct from new.stock)
  execute function public.log_stock_change();


-- 초기 시드: 현재 재고를 'init' 으로 기록 (이전 이력 없이 시작점)
insert into public.stock_history (product_id, delta, stock_after, reason)
select id, stock, stock, 'init' from public.products
on conflict do nothing;
