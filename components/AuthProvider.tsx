'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthUser, Role } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const KEY = 'tna.auth.v1';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  loginWithKakao: (redirectPath?: string) => Promise<{ error: string | null }>;
  upgradeToStudent: (code: string) => Promise<{ ok: boolean; error: string | null }>;
  updateName: (name: string) => Promise<{ ok: boolean; error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error: string | null }>;
  refreshProfile: () => Promise<void>;
  loginDemo: (role: Role) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function pickName(role: Role): string {
  if (role === 'admin') return '관리자';
  if (role === 'student') return '수강생';
  return '게스트';
}

async function fetchProfile(userId: string): Promise<{ name: string; role: Role } | null> {
  try {
    // 8초 안에 못 가져오면 포기 (profile 없어도 인증은 유지됨)
    const result = await Promise.race([
      supabase.from('profiles').select('name, role').eq('id', userId).maybeSingle(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);
    const data = (result as { data: { name: string; role: string } | null }).data;
    if (!data) return null;
    return { name: data.name, role: data.role as Role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) 초기 세션 복구 + Supabase 인증 상태 구독
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Supabase 미설정 시: 기존 localStorage 데모 모드만 동작
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {}
      setLoading(false);
      return;
    }

    let mounted = true;

    // 세션이 있을 때 즉시 user를 임시 정보로 설정 (이름은 이메일 prefix, role은 user)
    // 그 후 백그라운드에서 진짜 프로필을 가져와 갱신
    const applySession = (session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      // 1) 즉시: 세션에서 알 수 있는 최소 정보로 user 설정 (UI 즉시 반응)
      const meta = session.user.user_metadata ?? {};
      const fallbackName =
        (meta.name as string) ||
        (meta.nickname as string) ||
        (meta.full_name as string) ||
        session.user.email?.split('@')[0] ||
        '회원';
      setUser({ id: session.user.id, name: fallbackName, role: 'user' });

      // 2) 백그라운드: 진짜 프로필(role 포함) fetch 후 덮어쓰기
      void fetchProfile(session.user.id).then((profile) => {
        if (!mounted || !profile) return;
        setUser({ id: session.user.id, name: profile.name, role: profile.role });
      });
    };

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session?.user) {
        applySession(session);
      } else {
        try {
          const raw = localStorage.getItem(KEY);
          if (raw && mounted) setUser(JSON.parse(raw));
        } catch {}
      }
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase가 설정되지 않았습니다.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase가 설정되지 않았습니다.' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const loginDemo = useCallback((role: Role) => {
    const demoUser: AuthUser = { id: `demo-${role}`, name: pickName(role), role };
    setUser(demoUser);
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(demoUser));
  }, []);

  const loginWithKakao = useCallback(async (redirectPath: string = '/') => {
    if (!isSupabaseConfigured) return { error: 'Supabase가 설정되지 않았습니다.' };
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const upgradeToStudent = useCallback(async (code: string) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
    const { data, error } = await supabase.rpc('upgrade_to_student', { code });
    if (error) return { ok: false, error: error.message };
    return { ok: data === true, error: data === true ? null : '잘못된 코드입니다.' };
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return { ok: false, error: '로그인이 필요합니다.' };
    const { error } = await supabase.from('profiles').update({ name }).eq('id', uid);
    if (error) return { ok: false, error: error.message };
    setUser((u) => (u ? { ...u, name } : u));
    return { ok: true, error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session?.user) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) setUser({ id: session.user.id, name: profile.name, role: profile.role });
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY);
    setUser(null);
    if (isSupabaseConfigured) await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, signupWithEmail, loginWithKakao, upgradeToStudent, updateName, updatePassword, refreshProfile, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
