import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="border-t border-gold/30 bg-card/60 mt-20">
      <div className="container-narrow pt-14 text-center mb-12">
        <div className="h-px bg-gold/30 mx-auto w-32 mb-6" />
        <p className="font-serif italic text-gold/80 text-base sm:text-lg mb-2">
          섬세한 도구, 완성된 시술.
        </p>
        <p className="text-[10px] tracking-eyebrow uppercase text-espresso">
          The Nature Academy
        </p>
      </div>
      <div className="container-narrow pb-10 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-serif text-xl mb-3">The Nature Academy</p>
          <p className="text-xs text-ink/60 leading-relaxed">
            엄선된 반영구 시술 전문 제품과
            <br />
            전문 교육 프로그램을 제공합니다.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-shop uppercase text-gold mb-3">Shop</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link href="/products" className="hover:text-gold">전체 상품</Link></li>
            <li><Link href="/products?cat=머신" className="hover:text-gold">머신</Link></li>
            <li><Link href="/products?cat=색소" className="hover:text-gold">색소</Link></li>
            <li><Link href="/brow" className="hover:text-gold">Brow Studio</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-shop uppercase text-gold mb-3">Support</p>
          <ul className="space-y-2 text-sm text-ink/70">
            <li><Link href="/faq" className="hover:text-gold">자주 묻는 질문</Link></li>
            <li><Link href="/notices" className="hover:text-gold">공지사항</Link></li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> 카카오톡 채널 상담
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="w-4 h-4" /> @the.nature.academy
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-shop uppercase text-gold mb-3">Newsletter</p>
          <p className="text-xs text-ink/60 mb-3 leading-relaxed">
            새 상품과 이벤트 소식을 먼저 받아보세요.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-gold/20">
        <div className="container-narrow py-5 text-[11px] text-ink/40 flex flex-wrap gap-3 justify-between items-center">
          <span>© {new Date().getFullYear()} The Nature Academy</span>
          <div className="flex gap-3 items-center">
            <Link href="/privacy" className="hover:text-gold transition">개인정보처리방침</Link>
            <span className="text-ink/20">·</span>
            <Link href="/terms" className="hover:text-gold transition">이용약관</Link>
            <span className="text-ink/20">·</span>
            <Link href="/refund" className="hover:text-gold transition">교환·환불</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
