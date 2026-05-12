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
  const { data } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  return { name: data.name, role: data.role as Role };
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

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted && profile) {
          setUser({ id: session.user.id, name: profile.name, role: profile.role });
        }
      } else {
        // Supabase 세션 없으면 데모 localStorage 확인
        try {
          const raw = localStorage.getItem(KEY);
          if (raw && mounted) setUser(JSON.parse(raw));
        } catch {}
      }
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser({ id: session.user.id, name: profile.name, role: profile.role });
        }
      } else {
        setUser(null);
      }
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
