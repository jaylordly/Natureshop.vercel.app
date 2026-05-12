'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { TextField } from '@/components/TextField';

const KAKAO_ENABLED = process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === '1';

export default function SignupPage() {
  const { signupWithEmail, loginWithKakao } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (password.length < 6) {
      setErr('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setBusy(true);
    const { error } = await signupWithEmail(email, password, name);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    router.push('/');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-beige py-12 px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-serif text-2xl tracking-wide mb-10 inline-block">
          The Nature Academy
        </Link>
        <h1 className="text-2xl font-serif mb-2">회원가입</h1>
        <p className="text-ink/60 text-sm mb-6">이메일로 가입하기</p>

        {KAKAO_ENABLED && (
          <>
            <button
              type="button"
              onClick={() => loginWithKakao('/')}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-[#3A1D1D] py-3 text-sm font-medium tracking-shop hover:opacity-90 transition mb-3"
            >
              <MessageCircle className="w-4 h-4 fill-current" /> 카카오로 시작하기
            </button>
            <div className="flex items-center gap-2 mb-4 text-[10px] tracking-shop uppercase text-ink/40">
              <span className="flex-1 h-px bg-divider" />
              또는 이메일로
              <span className="flex-1 h-px bg-divider" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="text-left space-y-3">
          <TextField label="이름" htmlFor="signup-name">
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
              autoComplete="name"
            />
          </TextField>
          <TextField label="이메일" htmlFor="signup-email">
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
              autoComplete="email"
            />
          </TextField>
          <TextField label="비밀번호 (6자 이상)" htmlFor="signup-pw">
            <input
              id="signup-pw"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <UserPlus className="w-4 h-4" /> {busy ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="text-xs text-ink/50 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-gold-dark hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
