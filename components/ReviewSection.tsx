import { Star } from 'lucide-react';

const REVIEWS = [
  { name: '김 ◯ ◯', stars: 5, text: '시술 안정성과 그립감이 정말 좋아요. 이제 다른 머신은 안 쓸 것 같아요.', tag: '디지털 머신' },
  { name: '박 ◯ ◯', stars: 5, text: '발색이 자연스럽고 유지력이 뛰어납니다. 고객 만족도가 훨씬 올라갔어요.', tag: '눈썹 색소' },
  { name: '이 ◯ ◯', stars: 4, text: '엠보 작업 시 결 표현이 디테일하게 살아납니다. 추천!', tag: '18U 블레이드' },
];

export default function ReviewSection() {
  return (
    <section className="container-narrow py-20">
      <div className="text-center mb-10">
        <p className="text-gold text-sm tracking-shop uppercase mb-2">Reviews</p>
        <h2 className="font-serif text-3xl sm:text-4xl">실제 사용 후기</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {REVIEWS.map((r) => (
          <article key={r.name} className="bg-card border border-gold/20 hover:border-gold/60 hover:shadow-gold-glow-soft transition p-6">
            <div className="flex gap-1 mb-3 text-gold">
              {Array.from({ length: r.stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-ink/80 leading-relaxed mb-4">“{r.text}”</p>
            <p className="text-xs text-ink/50 flex justify-between">
              <span>{r.name}</span>
              <span className="text-gold">{r.tag}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
