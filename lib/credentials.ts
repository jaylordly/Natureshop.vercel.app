/**
 * 데모 모드 자격증명 저장소.
 * Supabase 연결 전까지는 localStorage로 관리합니다.
 */

export const DEFAULT_ADMIN = { id: 'admin', password: 'admin123' };
export const DEFAULT_STUDENT_CODE = 'STUDENT2026';

const KEY_ADMIN = 'tna.admin.creds.v1';
const KEY_STUDENT = 'tna.student.code.v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getAdminCreds(): { id: string; password: string } {
  if (!isBrowser()) return DEFAULT_ADMIN;
  try {
    const raw = localStorage.getItem(KEY_ADMIN);
    if (!raw) return DEFAULT_ADMIN;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.id === 'string' && typeof parsed?.password === 'string') return parsed;
  } catch {}
  return DEFAULT_ADMIN;
}

export function setAdminCreds(creds: { id: string; password: string }) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_ADMIN, JSON.stringify(creds));
}

export function verifyAdmin(id: string, password: string): boolean {
  const c = getAdminCreds();
  return c.id === id.trim() && c.password === password;
}

export function getStudentCode(): string {
  if (!isBrowser()) return DEFAULT_STUDENT_CODE;
  return localStorage.getItem(KEY_STUDENT) || DEFAULT_STUDENT_CODE;
}

export function setStudentCode(code: string) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_STUDENT, code);
}

export function verifyStudentCode(code: string): boolean {
  return code.trim().toUpperCase() === getStudentCode().toUpperCase();
}
