-- ============================================================
-- orders_update_own 정책 제거 — 자기 주문 status 위변조 차단
--
-- 문제: 0002의 orders_update_own 은 본인 주문의 임의 수정을 허용한다.
--       → 인증 사용자가 anon 클라이언트로 자기 주문 status를
--         'paid'로 바꾸거나(미결제 결제완료 위조) 'refunded'를 되돌릴 수 있다.
--
-- 검토 결과 사용자 컨텍스트에서 주문을 UPDATE 하는 정당한 경로가 없다:
--   - 주문 생성: place_order RPC (security definer, INSERT)
--   - 관리자 상태 변경: orders_update_admin 정책으로 처리
--   - 환불: service role (RLS 우회)
-- 따라서 정책을 제거해 사용자의 주문 UPDATE를 전면 차단한다.
-- (향후 '주문 취소' 같은 사용자 기능이 필요하면 place_order처럼
--  security definer RPC로 검증된 전이만 허용할 것.)
-- ============================================================

drop policy if exists "orders_update_own" on public.orders;
