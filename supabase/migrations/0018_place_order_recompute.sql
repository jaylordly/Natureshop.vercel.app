-- ============================================================
-- place_order 보안 강화 — 금액을 서버(DB)에서 재계산
--
-- 기존: 클라이언트가 보낸 p_total · p_discount · price_at_purchase를 그대로 저장
--       → 인증 사용자가 RPC를 직접 호출해 임의의 낮은 금액으로 주문 가능 (결제 위변조)
--
-- 변경: p_items의 (product_id, quantity)만 신뢰하고
--        - price_at_purchase = products.price (DB 실제 판매가)
--        - subtotal = Σ(실제가 × 수량)
--        - discount = validate_coupon()로 서버 재검증
--        - total = greatest(0, subtotal - discount)
--       으로 재계산해 저장. p_total · p_discount 파라미터는 호환을 위해 받되 무시한다.
-- ============================================================

-- 0007이 만든 10-arg 오버로드 제거 (0008이 12-arg를 추가하며 함께 사라지지 않고 잔존)
drop function if exists public.place_order(
  text, integer, text, text, text, text, text, text, text, jsonb
);

create or replace function public.place_order(
  p_order_id text,
  p_total integer,            -- (무시됨, 호환용) 서버가 재계산
  p_status text,
  p_shipping_name text,
  p_shipping_phone text,
  p_shipping_address text,
  p_payment_key text,
  p_payment_method text,
  p_receipt_url text,
  p_items jsonb,
  p_coupon_code text default null,
  p_discount integer default 0  -- (무시됨, 호환용) 서버가 재계산
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

  -- 1) 재고 검증(행 락) + 실제 판매가로 subtotal 누적 — 클라이언트가 보낸 가격은 무시
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

  -- 2) 쿠폰 서버 재검증 — 유효할 때만 할인 적용
  if p_coupon_code is not null and p_coupon_code != '' then
    select valid, discount into v_valid, v_cdiscount
      from public.validate_coupon(p_coupon_code, v_subtotal);
    if coalesce(v_valid, false) then
      v_discount := coalesce(v_cdiscount, 0);
      v_coupon := p_coupon_code;
    end if;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  -- 3) 주문 헤더 (재계산한 total·discount·coupon)
  insert into orders (id, user_id, total, status, shipping_name, shipping_phone, shipping_address,
                      payment_key, payment_method, receipt_url, coupon_code, discount_amount)
  values (p_order_id, v_user, v_total, p_status, p_shipping_name, p_shipping_phone, p_shipping_address,
          nullif(p_payment_key, ''), nullif(p_payment_method, ''), nullif(p_receipt_url, ''),
          v_coupon, v_discount);

  -- 4) 라인(실제 판매가로 저장) + 재고 차감
  for item in
    select * from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
  loop
    select price into v_price from products where id = item.product_id;
    insert into order_items (order_id, product_id, quantity, price_at_purchase)
    values (p_order_id, item.product_id, item.quantity, v_price);

    update products set stock = stock - item.quantity, updated_at = now() where id = item.product_id;
  end loop;

  -- 5) 쿠폰 사용 횟수 증가 (유효 적용된 경우만)
  if v_coupon is not null then
    update coupons set used_count = used_count + 1 where code = v_coupon;
  end if;

  return p_order_id;
end;
$$;

grant execute on function public.place_order(
  text, integer, text, text, text, text, text, text, text, jsonb, text, integer
) to authenticated;
