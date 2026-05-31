-- ============================================================
-- 0021 운영 기능 — 배송추적 + 가상계좌 + 반품요청 + 재고이력 사유 정확화
-- (단일 배치: 대시보드 SQL Editor 또는 supabase db push 로 한 번에 적용)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1) orders: 배송/송장 + 가상계좌 필드, 상태 확장
-- ─────────────────────────────────────────────
alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists carrier text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists vbank jsonb,
  add column if not exists vbank_due timestamptz,
  add column if not exists confirmation_emailed_at timestamptz;

-- 상태 흐름:
--  즉시결제: paid → preparing → shipped → delivered
--  가상계좌: pending(입금대기) → paid → ...   / 만료: failed
--  환불:     refunding → refunded
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pending', 'paid', 'preparing', 'shipped', 'delivered',
    'failed', 'demo', 'refunding', 'refunded'
  ));


-- ─────────────────────────────────────────────
-- 2) returns: 고객 반품/교환 요청
-- ─────────────────────────────────────────────
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('refund', 'exchange')),
  reason text not null,
  detail text,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'completed')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists returns_order_idx on public.returns(order_id);
create index if not exists returns_status_idx on public.returns(status, created_at desc);

alter table public.returns enable row level security;

-- 본인 요청 생성 (자기 주문에 대해서만)
create policy "returns_insert_own"
  on public.returns for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- 본인 요청 조회
create policy "returns_select_own"
  on public.returns for select
  using (auth.uid() = user_id);

-- 관리자: 전체 조회/수정
create policy "returns_admin_all"
  on public.returns for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- 관리자 실시간 알림용 (선택)
alter publication supabase_realtime add table public.returns;


-- ─────────────────────────────────────────────
-- 3) 재고이력 사유 정확화 — 트랜잭션 GUC(app.stock_reason)로 전달
--    place_order='sale', restock_order='refund', 그 외 수동 편집='manual'
-- ─────────────────────────────────────────────
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

  -- 호출 RPC가 set_config로 설정한 사유를 읽고, 없으면 'manual'
  v_reason := coalesce(nullif(current_setting('app.stock_reason', true), ''), 'manual');

  insert into public.stock_history (product_id, delta, stock_after, reason)
  values (new.id, v_delta, new.stock, v_reason);

  return new;
end;
$$;

-- place_order: 사유 'sale' 설정 + 가상계좌(vbank) 저장.
-- 0018의 12-arg를 14-arg(p_vbank, p_vbank_due 추가)로 교체하므로 먼저 drop.
drop function if exists public.place_order(
  text, integer, text, text, text, text, text, text, text, jsonb, text, integer
);

create or replace function public.place_order(
  p_order_id text,
  p_total integer,
  p_status text,
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_address text,
  p_payment_key text,
  p_payment_method text,
  p_receipt_url text,
  p_items jsonb,
  p_coupon_code text default null,
  p_discount integer default 0,
  p_vbank jsonb default null,
  p_vbank_due timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  v_stock integer;
  v_price integer;
  v_user uuid;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_total integer;
  v_coupon text := null;
  v_valid boolean;
  v_cdiscount integer;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'authentication required';
  end if;

  perform set_config('app.stock_reason', 'sale', true);

  for item in
    select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    if item.quantity is null or item.quantity <= 0 then
      raise exception '수량이 올바르지 않습니다: %', item.product_id;
    end if;
    select price, stock into v_price, v_stock from products where id = item.product_id for update;
    if v_price is null then
      raise exception '상품을 찾을 수 없습니다: %', item.product_id;
    end if;
    if v_stock < item.quantity then
      raise exception '재고 부족: % (재고 %, 요청 %)', item.product_id, v_stock, item.quantity;
    end if;
    v_subtotal := v_subtotal + v_price * item.quantity;
  end loop;

  if p_coupon_code is not null and p_coupon_code != '' then
    select valid, discount into v_valid, v_cdiscount
      from public.validate_coupon(p_coupon_code, v_subtotal);
    if coalesce(v_valid, false) then
      v_discount := coalesce(v_cdiscount, 0);
      v_coupon := p_coupon_code;
    end if;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  insert into orders (id, user_id, total, status, shipping_name, shipping_phone, shipping_address,
                      payment_key, payment_method, receipt_url, coupon_code, discount_amount,
                      vbank, vbank_due)
  values (p_order_id, v_user, v_total, p_status, p_shipping_name, p_shipping_phone, p_shipping_address,
          nullif(p_payment_key, ''), nullif(p_payment_method, ''), nullif(p_receipt_url, ''),
          v_coupon, v_discount, p_vbank, p_vbank_due);

  for item in
    select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    select price into v_price from products where id = item.product_id;
    insert into order_items (order_id, product_id, quantity, price_at_purchase)
    values (p_order_id, item.product_id, item.quantity, v_price);

    update products set stock = stock - item.quantity, updated_at = now() where id = item.product_id;
  end loop;

  if v_coupon is not null then
    update coupons set used_count = used_count + 1 where code = v_coupon;
  end if;

  return p_order_id;
end;
$$;

grant execute on function public.place_order(
  text, integer, text, text, text, text, text, text, text, jsonb, text, integer, jsonb, timestamptz
) to authenticated;

-- restock_order: 사유 'refund' 설정
create or replace function public.restock_order(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.stock_reason', 'refund', true);
  update products p
  set stock = p.stock + oi.quantity, updated_at = now()
  from order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;
end;
$$;

grant execute on function public.restock_order(text) to authenticated;
