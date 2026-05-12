import { HelpCircle } from 'lucide-react';
import { listActiveFaqs, type FaqCategory } from '@/lib/faqs';
import FaqAccordion from './FaqAccordion';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '자주 묻는 질문',
  alternates: { canonical: '/faq' },
};

const CATEGORY_LABEL: Record<FaqCategory, string> = {
  general: '일반',
  order: '주문',
  payment: '결제',
  shipping: '배송',
  product: '상품',
};

export default async function FaqPage() {
  const faqs = await listActiveFaqs();
  const grouped: Record<FaqCategory, typeof faqs> = {
    general: [], order: [], payment: [], shipping: [], product: [],
  };
  for (const f of faqs) grouped[f.category].push(f);

  return (
    <section className="container-narrow py-16 max-w-3xl">
      <div className="mb-10 text-center">
        <div className="inline-flex w-12 h-12 bg-gold/15 text-gold rounded-full items-center justify-center mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">FAQ</p>
        <h1 className="font-serif text-4xl">자주 묻는 질문</h1>
      </div>

      {faqs.length === 0 ? (
        <p className="text-center text-ink/50 py-20">등록된 FAQ가 없어요.</p>
      ) : (
        (Object.keys(grouped) as FaqCategory[])
          .filter((cat) => grouped[cat].length > 0)
          .map((cat) => (
            <section key={cat} className="mb-10">
              <h2 className="font-serif text-xl mb-4 text-gold-dark">{CATEGORY_LABEL[cat]}</h2>
              <FaqAccordion items={grouped[cat]} />
            </section>
          ))
      )}
    </section>
  );
}
