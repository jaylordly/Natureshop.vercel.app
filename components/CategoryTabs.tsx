'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const TABS: { key?: string; label: string }[] = [
  { label: '전체' },
  { key: '머신', label: '머신' },
  { key: '엠보', label: '엠보' },
  { key: '색소', label: '색소' },
  { key: '위생', label: '위생' },
  { key: '케어', label: '케어' },
];

export default function CategoryTabs() {
  const params = useSearchParams();
  const active = params.get('cat') || '';

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-10">
      {TABS.map((t) => {
        const on = (t.key || '') === active;
        const href = t.key ? `/products?cat=${encodeURIComponent(t.key)}` : '/products';
        return (
          <Link
            key={t.label}
            href={href}
            className={`px-4 py-2 text-xs tracking-shop uppercase border transition ${
              on
                ? 'bg-ink text-beige border-ink'
                : 'border-gold/40 text-ink/70 hover:bg-ink hover:text-beige hover:border-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
