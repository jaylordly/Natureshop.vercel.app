-- ============================================================
-- 환불 원자성·idempotency 보강
--
--  1) 'refunding' 중간 상태 추가 — 환불을 원자적으로 "선점"하기 위함.
--     동시 환불 클릭 시 한 호출만 paid→refunding 전이에 성공하고,
--     나머지는 0 rows를 받아 중복 환불/중복 재고복원을 막는다.
--  2) restock_order RPC — order_items 기반 재고 복원을 단일 문으로 원자 처리
--     (기존 route의 read-then-write 루프는 동시성에 취약했음)
-- ============================================================

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'demo', 'refunding', 'refunded'));

create or replace function public.restock_order(p_order_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update products p
  set stock = p.stock + oi.quantity, updated_at = now()
  from order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;
$$;

grant execute on function public.restock_order(text) to authenticated;
