import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-beige to-gold-soft/40" />
      <div className="container-narrow relative py-20 sm:py-32 lg:py-44 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-8 sm:w-10 bg-gold" />
          <p className="text-gold text-[10px] sm:text-[11px] tracking-eyebrow uppercase">The Nature Academy</p>
          <span className="h-px w-8 sm:w-10 bg-gold" />
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl leading-[1.1] sm:leading-[1.05] mb-6 sm:mb-7 tracking-tight">
          섬세한 도구,
          <br />
          <em className="italic font-light text-gold">완성된 시술</em>
        </h1>
        <p className="text-ink/70 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
          반영구 시술 전문가를 위한 엄선된 컬렉션.
          <br className="hidden sm:block" />
          머신·엠보·색소·케어까지, 한 곳에서.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-ink text-beige px-5 sm:px-7 py-3 sm:py-4 text-xs sm:text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            컬렉션 보기 <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
          <Link
            href="#category"
            className="inline-flex items-center gap-2 border border-ink/30 px-5 sm:px-7 py-3 sm:py-4 text-xs sm:text-sm tracking-shop hover:bg-ink hover:text-beige transition"
          >
            카테고리 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}
