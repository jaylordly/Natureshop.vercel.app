'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

const ITEMS = [
  { href: '/admin', label: '대시보드', short: 'Dash' },
  { href: '/admin/orders', label: '주문', short: 'Ord' },
  { href: '/admin/products', label: '상품', short: 'Prd' },
  { href: '/admin/customers', label: '회원', short: 'Cus' },
  { href: '/admin/coupons', label: '쿠폰', short: 'Cpn' },
  { href: '/admin/student-codes', label: '코드', short: 'Code' },
  { href: '/admin/notices', label: '공지', short: 'Ntc' },
  { href: '/admin/faqs', label: 'FAQ', short: 'FAQ' },
  { href: '/admin/newsletter', label: '뉴스레터', short: 'Nws' },
  { href: '/admin/activity', label: '활동', short: 'Log' },
  { href: '/admin/settings', label: '설정', short: 'Set' },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-3 sm:gap-5 text-[11px] tracking-cta uppercase shrink-0">
      {ITEMS.map((i) => {
        const active = path === i.href || path.startsWith(i.href + '/');
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`transition ${active ? 'text-gold' : 'text-ink/70 hover:text-ink'}`}
          >
            <span className="hidden sm:inline">{i.label}</span>
            <span className="sm:hidden">{i.short}</span>
          </Link>
        );
      })}
      <Link
        href="/"
        className="text-ink/50 hover:text-gold transition flex items-center"
        aria-label="사이트로 가기"
        title="사이트로 가기"
      >
        <Home className="w-4 h-4 sm:hidden" />
        <span className="hidden sm:inline">사이트로</span>
      </Link>
    </nav>
  );
}
