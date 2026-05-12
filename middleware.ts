import { NextRequest, NextResponse } from 'next/server';

// TODO Supabase 연결 후 작성:
// - 로그인 사용자 세션 확인
// - /admin 접근 시 role === 'admin' 검사
// - 방문 로그 기록

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
