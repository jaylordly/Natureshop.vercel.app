-- ============================================================
-- product-images 버킷 정책 — 관리자만 업로드/수정/삭제, 누구나 조회
-- ============================================================

-- 관리자만 업로드
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.current_role() = 'admin'
  );

create policy "product_images_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.current_role() = 'admin'
  );

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and public.current_role() = 'admin'
  );

-- 누구나 조회 (public 버킷이지만 명시)
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');
