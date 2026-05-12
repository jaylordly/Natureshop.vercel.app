import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-beige py-12 px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex w-14 h-14 bg-gold/15 text-gold rounded-full items-center justify-center">
          <Compass className="w-7 h-7" />
        </div>
        <p className="text-[11px] tracking-cta uppercase text-gold mb-2">404</p>
        <h1 className="font-serif text-3xl sm:text-4xl mb-3">길을 잃으셨나요?</h1>
        <p className="text-ink/60 text-sm mb-10 leading-relaxed">
          요청하신 페이지를 찾을 수 없어요.<br />
          주소가 변경되었거나 삭제되었을 수 있어요.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            <Home className="w-4 h-4" /> 홈으로
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 border border-gold/40 px-6 py-3 text-sm tracking-shop hover:bg-ink hover:text-beige transition"
          >
            <Search className="w-4 h-4" /> 상품 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
