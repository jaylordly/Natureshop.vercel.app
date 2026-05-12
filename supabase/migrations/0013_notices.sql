-- ============================================================
-- 공지사항 (Notices) — 관리자가 등록, 활성 공지는 사이트 상단 배너로
-- ============================================================

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null default 'info' check (type in ('info', 'event', 'warning')),
  pinned boolean not null default false,             -- 상단 배너로 노출
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,                                -- null이면 무기한
  created_at timestamptz not null default now()
);

create index notices_active_idx on public.notices(active, pinned, created_at desc);

alter table public.notices enable row level security;

-- 누구나 활성 공지 조회
create policy "notices_select_active" on public.notices for select
  using (
    active = true
    and (ends_at is null or ends_at > now())
    and starts_at <= now()
  );

-- 관리자: 모든 작업
create policy "notices_admin_all" on public.notices for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
