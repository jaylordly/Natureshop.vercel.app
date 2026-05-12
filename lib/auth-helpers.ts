/**
 * Promise를 timeout 시간 내 끝나지 않으면 거부.
 * Supabase 콜드 스타트 등으로 응답이 지연될 때 UI가 영원히 멈추는 걸 방지.
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * 로그인 성공 후 SPA 라우팅 대신 하드 네비게이션.
 * AuthProvider의 onAuthStateChange와 router.push가 경합할 때 발생하는 멈춤을 회피.
 */
export function navigateAfterAuth(redirect: string) {
  if (typeof window === 'undefined') return;
  window.location.href = redirect;
}
