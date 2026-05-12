-- ============================================================
-- coupons — 할인 쿠폰 시스템
-- type: fixed (정액 ₩) | percent (정률 %)
-- ============================================================

create table public.coupons (
  code text primary key,
  label text,                                  -- 메모용 (예: "신규가입 환영")
  type text not null check (type in ('fixed', 'percent')),
  value integer not null check (value > 0),    -- 정액일 땐 원, 정률일 땐 % (1~100)
  min_order_amount integer not null default 0, -- 최소 주문 금액
  max_uses integer,                            -- null이면 무제한
  used_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- 관리자: 모든 작업
create policy "coupons_admin_all"
  on public.coupons for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- 인증 사용자: 활성 쿠폰 조회 (검증 위해)
create policy "coupons_authenticated_select"
  on public.coupons for select
  using (auth.uid() is not null and active = true);

-- orders 테이블에 쿠폰 정보 추가
alter table public.orders
  add column if not exists coupon_code text references public.coupons(code) on delete set null,
  add column if not exists discount_amount integer not null default 0;

-- validate_coupon — 쿠폰 검증 + 할인 금액 계산
create or replace function public.validate_coupon(p_code text, p_subtotal integer)
returns table(valid boolean, discount integer, message text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c record;
begin
  if auth.uid() is null then
    return query select false, 0, '로그인이 필요합니다.'::text;
    return;
  end if;

  select * into c from coupons where code = p_code;
  if c is null then
    return query select false, 0, '존재하지 않는 쿠폰 코드입니다.'::text;
    return;
  end if;
  if not c.active then
    return query select false, 0, '비활성화된 쿠폰입니다.'::text;
    return;
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return query select false, 0, '만료된 쿠폰입니다.'::text;
    return;
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return query select false, 0, '사용 한도를 초과한 쿠폰입니다.'::text;
    return;
  end if;
  if p_subtotal < c.min_order_amount then
    return query select false, 0, format('최소 주문 금액 ₩%s 이상부터 사용 가능합니다.', c.min_order_amount)::text;
    return;
  end if;

  declare
    d integer;
  begin
    if c.type = 'fixed' then
      d := least(c.value, p_subtotal);
    else
      d := (p_subtotal * c.value / 100);
    end if;
    return query select true, d, '쿠폰 적용됨'::text;
  end;
end;
$$;

grant execute on function public.validate_coupon(text, integer) to authenticated;

-- place_order 함수 확장 — 쿠폰 적용 + used_count 증가
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
  p_discount integer default 0
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  v_stock integer;
  v_user uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'authentication required';
  end if;

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer, price_at_purchase integer)
  loop
    select stock into v_stock from products where id = item.product_id for update;
    if v_stock is null then
      raise exception '상품을 찾을 수 없습니다: %', item.product_id;
    end if;
    if v_stock < item.quantity then
      raise exception '재고 부족: % (재고 %, 요청 %)', item.product_id, v_stock, item.quantity;
    end if;
  end loop;

  insert into orders (id, user_id, total, status, shipping_name, shipping_phone, shipping_address,
                      payment_key, payment_method, receipt_url, coupon_code, discount_amount)
  values (p_order_id, v_user, p_total, p_status, p_shipping_name, p_shipping_phone, p_shipping_address,
          nullif(p_payment_key, ''), nullif(p_payment_method, ''), nullif(p_receipt_url, ''),
          nullif(p_coupon_code, ''), coalesce(p_discount, 0));

  for item in select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer, price_at_purchase integer)
  loop
    insert into order_items (order_id, product_id, quantity, price_at_purchase)
    values (p_order_id, item.product_id, item.quantity, item.price_at_purchase);

    update products set stock = stock - item.quantity, updated_at = now() where id = item.product_id;
  end loop;

  -- 쿠폰 사용 횟수 증가
  if p_coupon_code is not null and p_coupon_code != '' then
    update coupons set used_count = used_count + 1 where code = p_coupon_code;
  end if;

  return p_order_id;
end;
$$;

grant execute on function public.place_order(text, integer, text, text, text, text, text, text, text, jsonb, text, integer) to authenticated;
