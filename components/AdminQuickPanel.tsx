'use client';
import Link from 'next/link';
import { Shield, LayoutDashboard, Package, ClipboardList, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function AdminQuickPanel() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return null;

  const cards = [
    {
      href: '/admin',
      icon: LayoutDashboard,
      label: '대시보드',
      desc: '매출·주문·방문 통계',
    },
    {
      href: '/admin/orders',
      icon: ClipboardList,
      label: '주문 관리',
      desc: '주문 조회·상태 변경',
    },
    {
      href: '/admin/products',
      icon: Package,
      label: '상품 관리',
      desc: '상품 추가·수정·삭제',
    },
  ];

  return (
    <section className="container-narrow py-10">
      <div className="border border-gold bg-ink text-beige p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-gold" />
          <p className="text-[11px] tracking-cta uppercase text-gold">Admin Quick Access</p>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl mb-1">
          안녕하세요, {user.name}님
        </h2>
        <p className="text-beige/60 text-sm mb-6">관리자 영역으로 빠르게 이동하세요</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cards.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between gap-3 bg-beige/5 hover:bg-gold hover:text-ink border border-beige/10 hover:border-gold p-4 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 text-gold group-hover:text-ink shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[11px] text-beige/50 group-hover:text-ink/60 truncate">{desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-beige/40 group-hover:text-ink group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
