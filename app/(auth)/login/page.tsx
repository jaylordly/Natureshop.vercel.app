'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, GraduationCap, Shield, UserCheck, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { TextField } from '@/components/TextField';

type Tab = 'email' | 'student' | 'admin';

const KAKAO_ENABLED = process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === '1';

function LoginInner() {
  const { loginDemo, loginWithEmail, loginWithKakao, upgradeToStudent, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  // 수강생 탭: 이메일/비번 + 코드
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentErr, setStudentErr] = useState('');
  const [studentBusy, setStudentBusy] = useState(false);

  // 관리자 탭: 이메일/비번
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminErr, setAdminErr] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  const handleDemo = (role: 'user' | 'student' | 'admin') => {
    loginDemo(role);
    router.push(role === 'admin' ? '/admin' : redirect);
  };

  const handleKakao = async () => {
    const { error } = await loginWithKakao(redirect);
    if (error) setEmailErr(error);
    // 성공이면 자동 리다이렉트되므로 이 컴포넌트는 사라짐
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr('');
    setEmailBusy(true);
    const { error } = await loginWithEmail(email, password);
    setEmailBusy(false);
    if (error) {
      setEmailErr(error);
      return;
    }
    router.push(redirect);
  };

  const handleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentErr('');
    setStudentBusy(true);
    const { error } = await loginWithEmail(studentEmail, studentPassword);
    if (error) {
      setStudentBusy(false);
      setStudentErr(error);
      return;
    }
    const { ok, error: upErr } = await upgradeToStudent(studentCode);
    setStudentBusy(false);
    if (!ok) {
      setStudentErr(upErr || '수강생 코드 인증에 실패했습니다.');
      return;
    }
    await refreshProfile();
    router.push(redirect);
  };

  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErr('');
    setAdminBusy(true);
    const { error } = await loginWithEmail(adminEmail, adminPw);
    if (error) {
      setAdminBusy(false);
      setAdminErr(error);
      return;
    }
    // 로그인 직후 role 확인 (세션 반영 전이므로 직접 조회)
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) {
      setAdminBusy(false);
      setAdminErr('세션을 확인할 수 없습니다.');
      return;
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
    setAdminBusy(false);
    if (prof?.role !== 'admin') {
      await supabase.auth.signOut();
      setAdminErr('관리자 권한이 없는 계정입니다.');
      return;
    }
    router.push('/admin');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-beige py-12 px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-serif text-2xl tracking-wide mb-10 inline-block">
          The Nature Academy
        </Link>
        <h1 className="text-2xl font-serif mb-2">로그인</h1>
        <p className="text-ink/60 text-sm mb-8">계정 유형을 선택하세요</p>

        <div className="flex border border-gold/40 mb-8" role="tablist">
          {(
            [
              { id: 'email', label: '일반' },
              { id: 'student', label: '수강생' },
              { id: 'admin', label: '관리자' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm tracking-shop transition ${
                tab === t.id ? 'bg-ink text-beige' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'email' && (
          <>
            {KAKAO_ENABLED && (
              <>
                <button
                  type="button"
                  onClick={handleKakao}
                  className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-[#3A1D1D] py-3 text-sm font-medium tracking-shop hover:opacity-90 transition mb-3"
                >
                  <MessageCircle className="w-4 h-4 fill-current" /> 카카오로 시작하기
                </button>
                <div className="flex items-center gap-2 mb-3 text-[10px] tracking-shop uppercase text-ink/40">
                  <span className="flex-1 h-px bg-divider" />
                  또는 이메일로
                  <span className="flex-1 h-px bg-divider" />
                </div>
              </>
            )}
          <form onSubmit={handleEmailLogin} className="text-left space-y-3">
            <TextField label="이메일" htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="email"
              />
            </TextField>
            <TextField label="비밀번호" htmlFor="login-pw">
              <input
                id="login-pw"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setEmailErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="current-password"
              />
            </TextField>
            {emailErr && <p className="text-red-600 text-xs">{emailErr}</p>}
            <button
              type="submit"
              disabled={emailBusy}
              className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" /> {emailBusy ? '로그인 중...' : '로그인'}
            </button>
            <p className="text-xs text-ink/50 text-center pt-2">
              <Link href="/forgot-password" className="text-ink/60 hover:text-gold transition">비밀번호 찾기</Link>
              <span className="mx-2 text-ink/30">·</span>
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-gold-dark hover:underline">
                회원가입
              </Link>
            </p>
          </form>
          </>
        )}

        {tab === 'student' && (
          <form onSubmit={handleStudent} className="text-left space-y-3">
            <TextField label="이메일" htmlFor="student-email">
              <input
                id="student-email"
                type="email"
                required
                value={studentEmail}
                onChange={(e) => {
                  setStudentEmail(e.target.value);
                  setStudentErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="email"
              />
            </TextField>
            <TextField label="비밀번호" htmlFor="student-pw">
              <input
                id="student-pw"
                type="password"
                required
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  setStudentErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="current-password"
              />
            </TextField>
            <TextField label="수강생 코드" htmlFor="student-code">
              <input
                id="student-code"
                type="text"
                required
                value={studentCode}
                onChange={(e) => {
                  setStudentCode(e.target.value.toUpperCase());
                  setStudentErr('');
                }}
                placeholder="STUDENT2026"
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none tracking-shop font-mono"
                autoComplete="off"
                spellCheck={false}
              />
            </TextField>
            {studentErr && <p className="text-red-600 text-xs">{studentErr}</p>}
            <button
              type="submit"
              disabled={studentBusy}
              className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" /> {studentBusy ? '인증 중...' : '수강생 로그인'}
            </button>
            <p className="text-xs text-ink/40 mt-1 text-center">기존 계정 + 수강 안내받은 코드를 입력하면 수강생으로 승급됩니다.</p>
          </form>
        )}

        {tab === 'admin' && (
          <form onSubmit={handleAdmin} className="text-left space-y-3">
            <TextField label="이메일" htmlFor="admin-email">
              <input
                id="admin-email"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setAdminErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="email"
              />
            </TextField>
            <TextField label="비밀번호" htmlFor="admin-pw">
              <input
                id="admin-pw"
                type="password"
                required
                value={adminPw}
                onChange={(e) => {
                  setAdminPw(e.target.value);
                  setAdminErr('');
                }}
                className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
                autoComplete="current-password"
              />
            </TextField>
            {adminErr && <p className="text-red-600 text-xs">{adminErr}</p>}
            <button
              type="submit"
              disabled={adminBusy}
              className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
            >
              <Shield className="w-4 h-4" /> {adminBusy ? '확인 중...' : '관리자 로그인'}
            </button>
            <p className="text-xs text-ink/40 text-center pt-2">관리자 권한(role: admin)이 부여된 계정만 입장 가능합니다.</p>
          </form>
        )}

        <div className="border-t border-gold/30 mt-10 pt-6">
          <p className="text-xs tracking-shop uppercase text-gold mb-2">체험 모드</p>
          <p className="text-xs text-ink/50 mb-3">로그인 없이 빠르게 둘러보기</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDemo('user')}
              className="flex-1 border border-gold/40 py-2 text-xs hover:bg-ink hover:text-beige focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold transition flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" /> 일반
            </button>
            <button
              onClick={() => handleDemo('student')}
              className="flex-1 border border-gold/40 py-2 text-xs hover:bg-ink hover:text-beige focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold transition flex items-center justify-center gap-1"
            >
              <GraduationCap className="w-3.5 h-3.5" /> 수강생
            </button>
            <button
              onClick={() => handleDemo('admin')}
              className="flex-1 border border-gold/40 py-2 text-xs hover:bg-ink hover:text-beige focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold transition flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> 관리자
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
