'use client';
import { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, profileSynced } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // 초기 로딩 또는 프로필 미동기화 상태 — 로딩 표시
  // (세션이 있는데 프로필이 아직 안 왔으면 잠깐 기다림)
  if (!ready || loading || (user && !profileSynced)) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-card border border-gold/30 p-10 sm:p-12 text-center">
          <Lock className="w-8 h-8 text-gold mx-auto mb-5" />
          <p className="text-xs tracking-brow uppercase text-gold mb-3">Restricted</p>
          <h1 className="font-serif text-2xl mb-3">관리자 전용</h1>
          <p className="text-sm text-ink/60 mb-8 leading-relaxed">관리자 로그인이 필요합니다.</p>
          <Link
            href="/login?redirect=/admin"
            className="inline-block bg-ink text-beige px-7 py-3.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
