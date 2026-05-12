import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import BestNewTabs from '@/components/BestNewTabs';
import PromoBanner from '@/components/PromoBanner';
import ReviewSection from '@/components/ReviewSection';
import SnsSection from '@/components/SnsSection';
import AdminQuickPanel from '@/components/AdminQuickPanel';
import { getAllProductsFromDb } from '@/lib/products';
import Link from 'next/link';
import Image from 'next/image';
import { SectionDivider } from '@/components/SectionDivider';

export const dynamic = 'force-dynamic';

// 홈은 루트 metadata의 default title("The Nature Academy — 프로페셔널 반영구 제품")을 그대로 사용
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const CATEGORIES = [
  { name: '머신', desc: '디지털 / 로터리', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop' },
  { name: '엠보', desc: '펜 / 블레이드', image: 'https://placehold.co/600x600/F6EFE6/8C6633?font=playfair&text=Embo' },
  { name: '색소', desc: '눈썹 / 입술', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80&auto=format&fit=crop' },
  { name: '위생', desc: '니들 / 멸균용품', image: 'https://images.unsplash.com/photo-1583912086296-be5b665036d3?w=600&q=80&auto=format&fit=crop' },
  { name: '케어', desc: '시술 후 케어', image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80&auto=format&fit=crop' },
];

export default async function HomePage() {
  const all = await getAllProductsFromDb();

  return (
    <>
      <Hero />

      <AdminQuickPanel />

      <SectionDivider />

      <section id="category" className="container-narrow py-12 sm:py-20 scroll-mt-20">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-gold text-xs sm:text-sm tracking-shop uppercase mb-2">Category</p>
          <h2 className="font-serif text-2xl sm:text-4xl">전문 카테고리</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href={`/products?cat=${c.name}`}
              className="group relative aspect-square overflow-hidden bg-cream border border-gold/25 hover:border-gold/60 hover:shadow-gold-glow-soft transition-all duration-500"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cream/90 via-cream/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 pb-5 text-center">
                <span className="block h-px w-8 bg-gold mb-3 mx-auto" />
                <h3 className="font-serif text-xl sm:text-3xl mb-1 text-ink group-hover:text-gold-dark transition">{c.name}</h3>
                <p className="text-[10px] sm:text-xs text-ink/60">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PromoBanner type="academy" />

      <BestNewTabs products={all} />

      <SectionDivider />

      <PromoBanner type="event" />

      <ReviewSection />

      <SectionDivider />

      <SnsSection />
    </>
  );
}
