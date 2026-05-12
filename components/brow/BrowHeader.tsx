'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/brow', label: 'Brow Studio', exact: true },
  { href: '/brow/portfolio', label: 'Portfolio' },
  { href: '/brow/simulation', label: 'Simulation' },
];

export default function BrowHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-[#E8DCD7] bg-[#F4ECE8]/90 backdrop-blur sticky top-0 z-30">
      <div className="container-narrow flex items-center justify-between h-16">
        <Link href="/brow" className="font-serif text-lg tracking-wide text-[#3A2D2D]">
          The Nature Academy <span className="text-[#A88080]/70">/ Brow</span>
        </Link>
        <nav className="flex items-center gap-6 text-[10px] tracking-eyebrow uppercase">
          {NAV.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`transition ${active ? 'text-[#8B4A4F]' : 'text-[#8B7A7A] hover:text-[#3A2D2D]'}`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link href="/" className="text-[#A88080]/70 hover:text-[#3A2D2D] transition">
            ← Shop
          </Link>
        </nav>
      </div>
    </header>
  );
}
