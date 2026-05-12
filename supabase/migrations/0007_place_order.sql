-- ============================================================
-- place_order — 주문 생성 + 재고 검증 + 재고 차감을 원자적으로
-- 클라이언트 createOrderInDb 대체
-- ============================================================

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
  p_items jsonb
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

  -- 재고 검증 (행 락)
  for item in
    select * from jsonb_to_recordset(p_items)
    as x(product_id text, quantity integer, price_at_purchase integer)
  loop
    select stock into v_stock from products where id = item.product_id for update;
    if v_stock is null then
      raise exception '상품을 찾을 수 없습니다: %', item.product_id;
    end if;
    if v_stock < item.quantity then
      raise exception '재고 부족: % (재고 %, 요청 %)', item.product_id, v_stock, item.quantity;
    end if;
  end loop;

  -- 주문 헤더
  insert into orders (id, user_id, total, status, shipping_name, shipping_phone, shipping_address, payment_key, payment_method, receipt_url)
  values (p_order_id, v_user, p_total, p_status, p_shipping_name, p_shipping_phone, p_shipping_address,
          nullif(p_payment_key, ''), nullif(p_payment_method, ''), nullif(p_receipt_url, ''));

  -- 라인 + 재고 차감
  for item in
    select * from jsonb_to_recordset(p_items)
    as x(product_id text, quantity integer, price_at_purchase integer)
  loop
    insert into order_items (order_id, product_id, quantity, price_at_purchase)
    values (p_order_id, item.product_id, item.quantity, item.price_at_purchase);

    update products set stock = stock - item.quantity, updated_at = now() where id = item.product_id;
  end loop;

  return p_order_id;
end;
$$;

grant execute on function public.place_order(text, integer, text, text, text, text, text, text, text, jsonb) to authenticated;
