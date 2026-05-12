'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

const OPTIONS = [
  { value: 'default', label: '기본 (베스트 → 신상품 → 가나다)' },
  { value: 'price-asc', label: '가격 낮은순' },
  { value: 'price-desc', label: '가격 높은순' },
  { value: 'name', label: '이름순 (가나다)' },
];

export default function ProductSortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('sort') ?? 'default';

  const onChange = (v: string) => {
    const sp = new URLSearchParams(params.toString());
    if (v === 'default') sp.delete('sort');
    else sp.set('sort', v);
    router.replace(`/products?${sp.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 mb-6 text-sm">
      <ArrowUpDown className="w-3.5 h-3.5 text-ink/50" />
      <span className="text-[10px] tracking-shop uppercase text-ink/50">정렬</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-gold/30 px-2 py-1 text-xs focus:outline-none focus:border-gold"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
