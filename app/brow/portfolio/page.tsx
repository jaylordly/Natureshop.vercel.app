import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow } from '@/components/Eyebrow';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: '직접 작업한 눈썹 시술 사례 — 자연결·또렷한 라인·풍성한 볼륨·라이트.',
  alternates: { canonical: '/brow/portfolio' },
};

const PORTFOLIO = [
  { id: 'b1', title: 'Soft Natural', style: 'Natural', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&auto=format&fit=crop' },
  { id: 'b2', title: 'Modern Defined', style: 'Defined', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80&auto=format&fit=crop' },
  { id: 'b3', title: 'Full Volume', style: 'Full', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80&auto=format&fit=crop' },
  { id: 'b4', title: 'Soft Light', style: 'Light', img: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&q=80&auto=format&fit=crop' },
  { id: 'b5', title: 'Effortless Line', style: 'Natural', img: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80&auto=format&fit=crop' },
  { id: 'b6', title: 'Sharp Arch', style: 'Defined', img: 'https://images.unsplash.com/photo-1489156886794-fd4d7a8f8c71?w=800&q=80&auto=format&fit=crop' },
  { id: 'b7', title: 'Daily Soft', style: 'Light', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80&auto=format&fit=crop' },
  { id: 'b8', title: 'Full Bloom', style: 'Full', img: 'https://images.unsplash.com/photo-1502720433255-614171a1835e?w=800&q=80&auto=format&fit=crop' },
  { id: 'b9', title: 'Refined Edge', style: 'Defined', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format&fit=crop' },
  { id: 'b10', title: 'Quiet Presence', style: 'Natural', img: 'https://images.unsplash.com/photo-1469594292607-7bd90f8d3ba4?w=800&q=80&auto=format&fit=crop' },
  { id: 'b11', title: 'Bold Statement', style: 'Full', img: 'https://images.unsplash.com/photo-1517315003714-a071486bd9ea?w=800&q=80&auto=format&fit=crop' },
  { id: 'b12', title: 'Gentle Curve', style: 'Light', img: 'https://images.unsplash.com/photo-1504593812-1ad6b50aaf2f?w=800&q=80&auto=format&fit=crop' },
];

export default function PortfolioPage() {
  return (
    <>
      <section className="container-narrow py-20 sm:py-24 text-center">
        <Eyebrow text="Portfolio" tone="brow" className="mb-7" />
        <h1 className="font-serif text-4xl sm:text-5xl mb-5 text-[#3A2D2D] tracking-tight">
          시술 <em className="italic font-light text-[#A88080]">사례</em>
        </h1>
        <p className="text-[#8B7A7A] text-sm max-w-md mx-auto leading-relaxed font-light">
          정성껏 기록한 실제 시술 결과입니다.
          <br />
          마우스를 올리면 컬러 원본이 보입니다.
        </p>
      </section>

      <section className="container-narrow pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {PORTFOLIO.map((p) => (
            <article
              key={p.id}
              className="bg-[#FFFFFF] border border-[#E8DCD7] aspect-[3/4] relative group overflow-hidden hover:shadow-[0_10px_40px_rgba(28,28,28,0.08)] transition-shadow duration-500"
            >
              <Image
                src={p.img}
                alt={p.title}
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3A2D2D]/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="text-[10px] tracking-brow uppercase text-[#8B4A4F] mb-1">{p.style}</p>
                <h3 className="font-serif text-lg sm:text-xl text-white">{p.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="h-px bg-[#E8DCD7]" />

      <section className="container-narrow py-20 sm:py-28 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl mb-4 text-[#3A2D2D] tracking-tight">
          이런 결을 <em className="italic font-light text-[#A88080]">원하시나요?</em>
        </h2>
        <p className="text-[#8B7A7A] text-sm mb-10 max-w-md mx-auto leading-relaxed font-light">
          상담을 통해 가장 잘 어울리는 라인을 함께 찾아드립니다.
        </p>
        <Link
          href="/brow/simulation"
          className="inline-block border border-[#3A2D2D] text-[#3A2D2D] hover:bg-[#3A2D2D] hover:text-[#FFFFFF] px-10 py-4 text-[11px] tracking-eyebrow uppercase transition-colors duration-300"
        >
          시뮬레이션 해보기
        </Link>
      </section>
    </>
  );
}
