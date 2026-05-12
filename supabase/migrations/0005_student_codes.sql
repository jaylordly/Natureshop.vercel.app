-- ============================================================
-- student_codes — 수강생 코드 관리
-- 관리자가 코드 발급/회수, 사용자는 코드로 student 역할 승급
-- ============================================================

create table public.student_codes (
  code text primary key,
  label text,                                  -- 메모용 (예: "2026 봄학기")
  active boolean not null default true,
  used_count integer not null default 0,
  max_uses integer,                            -- null이면 무제한
  created_at timestamptz not null default now(),
  expires_at timestamptz                       -- null이면 무기한
);

-- 기존 코드 미리 삽입
insert into public.student_codes (code, label, active) values
  ('STUDENT2026', '기본 수강생 코드', true)
on conflict (code) do nothing;

alter table public.student_codes enable row level security;

-- 관리자만 모든 코드 조회/CRUD
create policy "student_codes_admin_all"
  on public.student_codes for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- 수강생 승급 함수 갱신 — DB 테이블 사용
create or replace function public.upgrade_to_student(code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into rec from public.student_codes sc where sc.code = upgrade_to_student.code;
  if rec is null then
    return false;
  end if;
  if not rec.active then
    return false;
  end if;
  if rec.expires_at is not null and rec.expires_at < now() then
    return false;
  end if;
  if rec.max_uses is not null and rec.used_count >= rec.max_uses then
    return false;
  end if;

  update public.profiles set role = 'student' where id = auth.uid() and role = 'user';
  update public.student_codes set used_count = used_count + 1 where student_codes.code = upgrade_to_student.code;

  return true;
end;
$$;
