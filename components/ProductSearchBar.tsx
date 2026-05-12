'use client';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ProductSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [q, setQ] = useState(initial);

  // 입력 후 300ms 정지하면 URL 갱신 (디바운스)
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q.trim()) sp.set('q', q.trim());
      else sp.delete('q');
      router.replace(`/products?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="bg-card border border-gold/30 mb-8 px-4 py-3 flex items-center gap-2">
      <Search className="w-4 h-4 text-ink/40 shrink-0" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상품명으로 검색..."
        className="flex-1 bg-transparent text-sm focus:outline-none"
      />
      {q && (
        <button
          onClick={() => setQ('')}
          aria-label="검색어 지우기"
          className="text-ink/40 hover:text-ink transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
