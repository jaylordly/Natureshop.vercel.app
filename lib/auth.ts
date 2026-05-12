import type { Role, Visibility } from './types';

export function canViewProduct(role: Role | undefined, visibility: Visibility): boolean {
  if (visibility === 'public') return true;
  if (visibility === 'student') return role === 'student' || role === 'admin';
  if (visibility === 'admin') return role === 'admin';
  return false;
}
