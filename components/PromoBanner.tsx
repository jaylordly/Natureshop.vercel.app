import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Props {
  type: 'academy' | 'event';
}

const COPY: Record<Props['type'], { eyebrow: string; title: string; desc: string; href: string; cta: string }> = {
  academy: {
    eyebrow: 'Academy',
    title: '전문가 양성 과정',
    desc: '입문부터 마스터까지 — 커리어를 다지는 체계적인 커리큘럼.',
    href: '/login',
    cta: '수강 안내',
  },
  event: {
    eyebrow: 'Event',
    title: '시즌 프로모션',
    desc: '엄선된 베스트 제품을 시즌 특가로 만나보세요.',
    href: '/products',
    cta: '이벤트 보기',
  },
};

export default function PromoBanner({ type }: Props) {
  const c = COPY[type];
  const dark = type === 'academy';
  return (
    <section className={`my-16 ${dark ? 'bg-ink text-beige' : 'bg-gold/10'}`}>
      <div className="container-narrow py-16 sm:py-20 grid md:grid-cols-[1fr_auto] items-center gap-8">
        <div>
          <p className={`text-[11px] tracking-eyebrow uppercase mb-3 ${dark ? 'text-gold' : 'text-gold'}`}>{c.eyebrow}</p>
          <h3 className="font-serif text-3xl sm:text-4xl mb-3">{c.title}</h3>
          <p className={`text-sm ${dark ? 'text-beige/80' : 'text-ink/70'}`}>{c.desc}</p>
        </div>
        <Link
          href={c.href}
          className={`inline-flex items-center gap-2 px-7 py-4 text-xs tracking-shop uppercase transition ${
            dark ? 'bg-gold text-ink hover:bg-gold-soft' : 'bg-ink text-beige hover:bg-gold hover:text-ink'
          }`}
        >
          {c.cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
