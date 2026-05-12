'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HistoryRow {
  id: string;
  delta: number;
  stockAfter: number;
  reason: string;
  referenceId: string | null;
  createdAt: number;
}

const REASON_LABEL: Record<string, string> = {
  init: '초기 등록',
  sale: '판매',
  refund: '환불',
  manual: '수동 조정',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function StockHistorySection({ productId }: { productId: string }) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('stock_history')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(30);
      setHistory(
        (data ?? []).map((r) => ({
          id: r.id,
          delta: r.delta,
          stockAfter: r.stock_after,
          reason: r.reason,
          referenceId: r.reference_id,
          createdAt: new Date(r.created_at).getTime(),
        })),
      );
      setLoading(false);
    })();
  }, [productId]);

  return (
    <div className="mt-8 border-t border-gold/20 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-gold" />
        <h2 className="font-serif text-lg">재고 변동 이력</h2>
        <span className="text-xs text-ink/40 ml-auto">{loading ? '' : `최근 ${history.length}건`}</span>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40 py-6 text-center">불러오는 중...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-ink/40 py-6 text-center">이력이 없어요</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {history.map((h) => {
            const up = h.delta > 0;
            return (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2 border-b border-gold/10 last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  {up ? <TrendingUp className="w-3.5 h-3.5 text-gold-dark" /> : <TrendingDown className="w-3.5 h-3.5 text-wine-dark" />}
                  <span className="text-xs tracking-shop uppercase text-ink/60">{REASON_LABEL[h.reason] ?? h.reason}</span>
                  {h.referenceId && <span className="text-[10px] font-mono text-ink/40 truncate">{h.referenceId}</span>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-medium ${up ? 'text-gold-dark' : 'text-wine-dark'}`}>{up ? '+' : ''}{h.delta}</span>
                  <span className="text-ink/40 text-xs ml-2">→ {h.stockAfter}개</span>
                </div>
                <span className="text-[10px] text-ink/40 shrink-0 hidden sm:inline">{fmt(h.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
