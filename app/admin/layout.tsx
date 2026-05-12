import Link from 'next/link';
import AdminGuard from './AdminGuard';
import AdminNav from './AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <main className="min-h-screen bg-beige">
        <header className="border-b border-gold/30 bg-card/85 backdrop-blur sticky top-0 z-10">
          <div className="container-narrow flex justify-between items-center gap-3 h-16">
            <Link href="/admin" className="font-serif text-base sm:text-xl truncate flex items-center">
              <span className="hidden sm:inline">The Nature Academy</span>
              <span className="sm:hidden">TNA</span>
              <span className="text-gold/60 mx-2">·</span>
              <span className="text-[10px] tracking-cta uppercase text-gold/70 font-sans font-normal">관리자</span>
            </Link>
            <AdminNav />
          </div>
        </header>
        {children}
      </main>
    </AdminGuard>
  );
}
