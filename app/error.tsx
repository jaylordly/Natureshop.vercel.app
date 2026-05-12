'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (실 운영에서는 Sentry 등으로)
    console.error('[app error]', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-beige px-6">
      <div className="max-w-md text-center">
        <div className="inline-flex w-14 h-14 bg-wine-dark/10 text-wine-dark rounded-full items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <p className="text-[11px] tracking-cta uppercase text-wine-dark mb-2">Error</p>
        <h1 className="font-serif text-3xl mb-3">문제가 발생했어요</h1>
        <p className="text-sm text-ink/60 mb-2 leading-relaxed">
          요청을 처리하는 도중 예기치 못한 오류가 발생했습니다.<br />
          잠시 후 다시 시도해 주세요.
        </p>
        {error.digest && (
          <p className="text-[10px] text-ink/30 font-mono mb-8">에러 ID: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            <RotateCw className="w-4 h-4" /> 다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-gold/40 px-6 py-3 text-sm tracking-shop hover:bg-ink hover:text-beige transition"
          >
            <Home className="w-4 h-4" /> 홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
