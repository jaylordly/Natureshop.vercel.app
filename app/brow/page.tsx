import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Brow Studio',
  description: '한 사람의 얼굴에서 가장 섬세한 표현, 눈썹. 시술 사례와 스타일 시뮬레이션을 만나보세요.',
  alternates: { canonical: '/brow' },
};

export default function BrowHomePage() {
  return (
    <>
      <section className="container-narrow py-28 sm:py-36 lg:py-44 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-10 bg-[#A88080]" />
          <p className="text-[#8B7A7A] text-[11px] tracking-eyebrow uppercase">The Brow Studio</p>
          <span className="h-px w-10 bg-[#A88080]" />
        </div>
        <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl leading-[0.95] mb-10 tracking-tight text-[#3A2D2D]">
          섬세한 라인,
          <br />
          <em className="italic font-light text-[#A88080]">우아한 형태</em>
        </h1>
        <p className="text-[#8B7A7A] text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-light">
          한 사람의 얼굴에서 가장 섬세한 표현, 눈썹.
          <br />
          The Nature Academy의 시술과 시뮬레이션을 만나보세요.
        </p>
      </section>

      <div className="h-px bg-[#E8DCD7]" />

      <section className="container-narrow py-20 sm:py-28">
        <div className="grid md:grid-cols-2 gap-8">
          <Link
            href="/brow/portfolio"
            className="bg-[#FFFFFF] border border-[#E8DCD7] p-10 sm:p-14 lg:p-20 group hover:shadow-[0_8px_30px_rgba(28,28,28,0.06)] hover:bg-[#FBF1ED] transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-6 bg-[#A88080]" />
              <p className="text-[10px] tracking-eyebrow uppercase text-[#8B7A7A]">01</p>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-3 leading-[0.95] text-[#3A2D2D]">Portfolio</h2>
            <p className="text-[10px] tracking-brow uppercase text-[#8B7A7A] mb-8">시술 사례</p>
            <p className="text-[#8B7A7A] text-sm leading-relaxed mb-12 max-w-sm font-light">
              완성된 시술 사례를 모았습니다. 자연스러운 결, 또렷한 라인 — 다양한 스타일의 결과를 만나보세요.
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] tracking-eyebrow uppercase text-[#3A2D2D] group-hover:text-[#8B4A4F] border-b border-[#E8DCD7] group-hover:border-[#8B4A4F] pb-1 transition">
              View Portfolio <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/brow/simulation"
            className="bg-[#FFFFFF] border border-[#E8DCD7] p-10 sm:p-14 lg:p-20 group hover:shadow-[0_8px_30px_rgba(28,28,28,0.06)] hover:bg-[#FBF1ED] transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-6 bg-[#A88080]" />
              <p className="text-[10px] tracking-eyebrow uppercase text-[#8B7A7A]">02</p>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl mb-3 leading-[0.95] text-[#3A2D2D]">Simulation</h2>
            <p className="text-[10px] tracking-brow uppercase text-[#8B7A7A] mb-8">스타일 시뮬레이션</p>
            <p className="text-[#8B7A7A] text-sm leading-relaxed mb-12 max-w-sm font-light">
              본인 얼굴에 어울리는 눈썹 스타일을 미리 시뮬레이션해 보세요. 자연·또렷·풍성·라이트 4가지 톤.
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] tracking-eyebrow uppercase text-[#3A2D2D] group-hover:text-[#8B4A4F] border-b border-[#E8DCD7] group-hover:border-[#8B4A4F] pb-1 transition">
              Start Simulation <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
