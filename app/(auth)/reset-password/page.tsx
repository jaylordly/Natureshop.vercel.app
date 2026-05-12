'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TextField } from '@/components/TextField';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (pw1.length < 6) {
      setErr('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (pw1 !== pw2) {
      setErr('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/'), 2000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-beige py-12 px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-serif text-2xl tracking-wide mb-10 inline-block">
          The Nature Academy
        </Link>
        <h1 className="text-2xl font-serif mb-2">새 비밀번호 설정</h1>

        {done ? (
          <>
            <CheckCircle className="w-10 h-10 text-gold mx-auto my-6" />
            <p className="text-ink/70 text-sm">비밀번호가 변경되었습니다.</p>
            <p className="text-xs text-ink/50 mt-2">홈으로 이동합니다...</p>
          </>
        ) : (
          <>
            <p className="text-ink/60 text-sm mb-8">새로 사용할 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleSubmit} className="text-left space-y-3">
              <TextField label="새 비밀번호 (6자 이상)" htmlFor="rp-pw1">
                <input
                  id="rp-pw1"
                  type="password"
                  required
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                  autoComplete="new-password"
                />
              </TextField>
              <TextField label="새 비밀번호 확인" htmlFor="rp-pw2">
                <input
                  id="rp-pw2"
                  type="password"
                  required
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                  autoComplete="new-password"
                />
              </TextField>
              {err && <p className="text-red-600 text-xs">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
              >
                <Lock className="w-4 h-4" /> {busy ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
