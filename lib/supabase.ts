import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// 서버(Node)에서만 cache: 'no-store' 적용 — Next.js의 fetch 캐싱을 끔.
// 브라우저에선 기본 동작 사용 (불필요한 오버헤드 제거).
const isServer = typeof window === 'undefined';

export const supabase = createClient(url, anonKey, {
  global: isServer
    ? { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
    : undefined,
});

export const isSupabaseConfigured = Boolean(url && anonKey);
