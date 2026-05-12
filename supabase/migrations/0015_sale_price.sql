-- ============================================================
-- 상품 할인가 — original_price 추가, price는 "판매가"
-- price < original_price 이면 할인 중
-- ============================================================

alter table public.products
  add column if not exists original_price integer;

-- 기존 상품의 original_price는 NULL (할인 안 함 상태)
-- 관리자가 수동으로 설정
