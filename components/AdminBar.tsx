'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Package, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function AdminBar() {
  const { user, logout } = useAuth();
  const path = usePathname();

  // 관리자만 + 관리자 페이지 내부에선 숨김 (이미 AdminNav가 있음)
  if (!user || user.role !== 'admin') return null;
  if (path.startsWith('/admin')) return null;

  return (
    <div className="bg-ink text-beige text-xs">
      <div className="container-narrow flex items-center justify-between h-9 gap-2">
        <Link href="/admin" className="flex items-center gap-1.5 min-w-0 hover:text-gold transition">
          <Shield className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="tracking-cta uppercase text-gold whitespace-nowrap text-[10px] sm:text-xs">Admin</span>
          <span className="hidden sm:inline text-beige/40">·</span>
          <span className="hidden sm:inline truncate">{user.name}</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link href="/admin" className="flex items-center gap-1 hover:text-gold transition" title="대시보드">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">대시보드</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-1 hover:text-gold transition" title="주문 관리">
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden md:inline">주문</span>
          </Link>
          <Link href="/admin/products" className="flex items-center gap-1 hover:text-gold transition" title="상품 관리">
            <Package className="w-3.5 h-3.5" />
            <span className="hidden md:inline">상품</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-1 hover:text-gold transition" aria-label="로그아웃" title="로그아웃">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">로그아웃</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
