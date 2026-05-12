'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextField } from '@/components/TextField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-beige py-12 px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-serif text-2xl tracking-wide mb-10 inline-block">
          The Nature Academy
        </Link>
        <h1 className="text-2xl font-serif mb-2">비밀번호 찾기</h1>

        {done ? (
          <>
            <p className="text-ink/70 text-sm mb-6">
              <span className="font-medium">{email}</span>로<br />
              비밀번호 재설정 링크를 보냈어요.
            </p>
            <p className="text-xs text-ink/50">이메일 받은 편지함을 확인해 주세요. 도착하지 않으면 스팸함도 확인.</p>
            <Link href="/login" className="mt-8 inline-flex items-center gap-1 text-xs text-gold-dark hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> 로그인으로
            </Link>
          </>
        ) : (
          <>
            <p className="text-ink/60 text-sm mb-8">가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.</p>
            <form onSubmit={handleSubmit} className="text-left space-y-3">
              <TextField label="이메일" htmlFor="fp-email">
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                  autoComplete="email"
                />
              </TextField>
              {err && <p className="text-red-600 text-xs">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
              >
                <Mail className="w-4 h-4" /> {busy ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
            <p className="text-xs text-ink/50 mt-6">
              <Link href="/login" className="text-gold-dark hover:underline">로그인으로 돌아가기</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
