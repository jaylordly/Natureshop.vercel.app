'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * OAuth 콜백.
 *
 * Supabase의 OAuth는 두 가지 흐름이 있음:
 * 1. PKCE (코드 교환): URL에 ?code=xxx 가 옴 → exchangeCodeForSession
 * 2. Implicit: URL fragment(#access_token=...)로 토큰이 옴 → Supabase JS가 자동 처리
 *
 * 두 케이스 모두 처리.
 */
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const redirect = params.get('redirect') || '/';
    const code = params.get('code');
    const errDesc = params.get('error_description');

    if (errDesc) {
      setErr(errDesc);
      return;
    }

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErr(error.message);
            return;
          }
        }
        // implicit flow의 경우 supabase-js가 onAuthStateChange로 처리
        // 잠시 기다린 후 세션 확인 후 redirect
        await new Promise((r) => setTimeout(r, 300));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErr('로그인 정보를 확인할 수 없습니다.');
          return;
        }
        router.replace(redirect);
      } catch (e) {
        setErr(e instanceof Error ? e.message : '알 수 없는 오류');
      }
    })();
  }, [params, router]);

  if (err) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-beige px-6">
        <div className="max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-4" />
          <h1 className="font-serif text-2xl mb-3">로그인 처리에 실패했어요</h1>
          <p className="text-sm text-ink/70 mb-6">{err}</p>
          <Link href="/login" className="inline-block bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition">
            로그인으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-7 h-7 text-gold animate-spin mx-auto mb-4" />
        <p className="text-sm text-ink/70">로그인 처리 중입니다...</p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
