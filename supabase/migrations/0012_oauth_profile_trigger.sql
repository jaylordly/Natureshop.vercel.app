-- ============================================================
-- handle_new_user 트리거 보강 — OAuth (카카오 등)의 메타데이터 처리
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  -- 이름 추출 우선순위:
  -- 1) raw_user_meta_data->'name'  (자체 회원가입 시 우리가 넣은 값)
  -- 2) raw_user_meta_data->'full_name' (Google 등 일부 OAuth)
  -- 3) raw_user_meta_data->'nickname' (Kakao)
  -- 4) raw_user_meta_data->'preferred_username'
  -- 5) 이메일 prefix
  v_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    '회원'
  );

  insert into public.profiles (id, name, role)
  values (
    new.id,
    v_name,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
