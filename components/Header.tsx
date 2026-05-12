'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, LogOut, Menu, X, Heart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { useAuth } from './AuthProvider';

const NAV = [
  { href: '/products', label: '상품' },
  { href: '/brow', label: 'Brow Studio' },
];

export default function Header() {
  const path = usePathname();
  const { items } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="border-b border-gold/30 bg-card/80 backdrop-blur sticky top-0 z-30">
      <div className="container-narrow flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-xl tracking-wide">
          The Nature Academy
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`tracking-wide transition ${active ? 'text-gold' : 'text-ink/70 hover:text-ink'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4 text-sm text-ink/70">
          {user ? (
            <>
              <Link href="/account" className="text-xs hover:text-gold transition">
                {user.name} <span className="text-gold">· {user.role}</span>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="hover:text-gold transition">
                  관리자
                </Link>
              )}
              <button onClick={logout} className="hover:text-gold transition flex items-center gap-1">
                <LogOut className="w-4 h-4" /> 로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-gold transition flex items-center gap-1">
              <User className="w-4 h-4" /> 로그인
            </Link>
          )}
          {user && (
            <Link href="/account/wishlist" className="hover:text-wine-dark transition" aria-label="찜한 상품">
              <Heart className="w-5 h-5" />
            </Link>
          )}
          <Link href="/cart" className="relative hover:text-gold transition">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-beige text-[10px] tracking-shop rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <Link
            href="/cart"
            className="relative p-2 text-ink/70 hover:text-gold transition"
            aria-label="장바구니"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-beige text-[10px] tracking-shop rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button className="p-2" onClick={() => setOpen((v) => !v)} aria-label="메뉴">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold/20 bg-card">
          <div className="container-narrow py-4 flex flex-col gap-3 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-1">
                {n.label}
              </Link>
            ))}
            <Link href="/cart" onClick={() => setOpen(false)} className="py-1">
              장바구니 {count > 0 && <span className="text-gold">({count})</span>}
            </Link>
            {user ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="py-1">
                  내 계정
                </Link>
                <button onClick={() => { logout(); setOpen(false); }} className="text-left py-1">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="py-1">
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
