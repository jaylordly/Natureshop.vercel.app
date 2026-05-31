import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * service role Supabase 클라이언트 (서버 전용).
 *
 * RLS를 우회하므로 **절대 클라이언트 컴포넌트에서 import 금지** —
 * Route Handler / Server Action 안에서만 사용.
 *
 * env 미설정 시 null을 반환하여 호출부가 데모 모드로 graceful fallback 하도록 한다.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
