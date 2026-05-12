-- ============================================================
-- 환불 상태 + 활동 로그
-- ============================================================

-- orders.status에 'refunded' 추가
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'demo', 'refunded'));

alter table public.orders
  add column if not exists refunded_at timestamptz;

-- 관리자 활동 로그
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,                  -- 'order.refund', 'product.create', 'product.delete', 'role.change', ...
  target_type text,                      -- 'order', 'product', 'profile', ...
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on public.activity_log(created_at desc);
create index activity_log_actor_idx on public.activity_log(actor_id);

alter table public.activity_log enable row level security;

-- 관리자만 조회/삽입
create policy "activity_log_admin_all" on public.activity_log for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
