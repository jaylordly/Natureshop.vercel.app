import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-beige to-gold-soft/40" />
      <div className="container-narrow relative py-28 sm:py-36 lg:py-44 text-center">
        <div className="flex items-center justify-center gap-3 mb-7">
          <span className="h-px w-10 bg-gold" />
          <p className="text-gold text-[11px] tracking-eyebrow uppercase">The Nature Academy</p>
          <span className="h-px w-10 bg-gold" />
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-7 tracking-tight">
          섬세한 도구,
          <br />
          <em className="italic font-light text-gold">완성된 시술</em>
        </h1>
        <p className="text-ink/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
          반영구 시술 전문가를 위한 엄선된 컬렉션.
          <br className="hidden sm:block" />
          머신·엠보·색소·케어까지, 한 곳에서 만나보세요.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-ink text-beige px-7 py-4 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            컬렉션 보기 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#category"
            className="inline-flex items-center gap-2 border border-ink/30 px-7 py-4 text-sm tracking-shop hover:bg-ink hover:text-beige transition"
          >
            카테고리 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}
