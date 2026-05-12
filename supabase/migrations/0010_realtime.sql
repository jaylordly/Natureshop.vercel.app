-- ============================================================
-- Realtime — orders 테이블의 INSERT 이벤트를 관리자에게 실시간 푸시
-- ============================================================

alter publication supabase_realtime add table public.orders;
