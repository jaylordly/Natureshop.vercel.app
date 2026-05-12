'use client';
import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';
import { listReviewsForProduct, createReview, deleteReview, type Review } from '@/lib/reviews';

interface Props {
  productId: string;
}

function StarRating({ value, onChange, size = 'sm' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n}점`}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`${cls} transition ${n <= value ? 'fill-gold text-gold' : 'text-ink/20'}`} />
        </button>
      ))}
    </div>
  );
}

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProductReviews({ productId }: Props) {
  const { user } = useAuth();
  const { show } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setReviews(await listReviewsForProduct(productId));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [productId]);

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.id.startsWith('demo-')) {
      show('로그인이 필요해요', 'error');
      return;
    }
    if (!content.trim()) return;
    setBusy(true);
    const { ok, error } = await createReview({ productId, rating, content: content.trim(), userName: user.name });
    setBusy(false);
    if (!ok) {
      if (error?.includes('row-level security')) {
        show('이 상품을 구매하신 후에 리뷰 작성이 가능해요', 'error');
      } else {
        show(error || '작성 실패', 'error');
      }
      return;
    }
    setContent('');
    setRating(5);
    show('리뷰가 등록되었습니다', 'success');
    void refresh();
  };

  const handleDelete = async (r: Review) => {
    if (!confirm('리뷰를 삭제하시겠어요?')) return;
    await deleteReview(r.id);
    show('리뷰 삭제됨', 'info');
    void refresh();
  };

  return (
    <div className="border-t border-gold/30 mt-12 pt-12">
      <div className="flex items-end justify-between gap-3 mb-8 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Reviews</p>
          <h2 className="font-serif text-2xl">상품 리뷰</h2>
        </div>
        {reviews.length > 0 && (
          <div className="text-right">
            <StarRating value={Math.round(avg)} size="lg" />
            <p className="text-sm text-ink/60 mt-1">{avg.toFixed(1)} / 5.0 · {reviews.length}개 리뷰</p>
          </div>
        )}
      </div>

      {user && !user.id.startsWith('demo-') && (
        <form onSubmit={handleSubmit} className="bg-card border border-gold/30 p-6 mb-8">
          <p className="text-sm mb-3">리뷰 작성</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상품을 사용해보신 솔직한 후기를 남겨주세요."
            rows={3}
            className="w-full bg-beige border border-gold/30 px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none mb-3"
          />
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-ink/50">구매하신 상품만 리뷰 작성이 가능합니다.</p>
            <button type="submit" disabled={busy || !content.trim()} className="bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40">
              {busy ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-center text-ink/40 py-8">불러오는 중...</p>
      ) : reviews.length === 0 ? (
        <p className="text-center text-ink/50 py-12 text-sm">첫 번째 리뷰를 남겨보세요.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-card border border-gold/20 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  <span className="text-sm font-medium">{r.userName}</span>
                  <span className="text-xs text-ink/40">{fmt(r.createdAt)}</span>
                </div>
                {(user?.id === r.userId || user?.role === 'admin') && (
                  <button onClick={() => handleDelete(r)} className="text-red-500 hover:text-red-700 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{r.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
