'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { listOrdersFromDb } from '@/lib/orders';

interface ProductStat {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

export default function TopProducts() {
  const [items, setItems] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const orders = await listOrdersFromDb();
      const map = new Map<string, ProductStat>();
      for (const o of orders) {
        if (o.status !== 'paid' && o.status !== 'demo') continue;
        for (const i of o.items) {
          const cur = map.get(i.productId) ?? { productId: i.productId, productName: i.productName, quantity: 0, revenue: 0 };
          cur.quantity += i.quantity;
          cur.revenue += i.priceAtPurchase * i.quantity;
          map.set(i.productId, cur);
        }
      }
      const sorted = Array.from(map.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      if (!cancelled) {
        setItems(sorted);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-card border border-gold/30 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gold" />
        <p className="text-[11px] tracking-shop uppercase text-ink/50">인기 상품 TOP 5</p>
      </div>
      {loading ? (
        <p className="text-sm text-ink/40 py-6 text-center">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink/40 py-6 text-center">아직 판매 데이터가 없어요</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p, idx) => (
            <li key={p.productId} className="flex items-center gap-3">
              <span className="w-6 h-6 flex items-center justify-center bg-gold/15 text-gold-dark text-xs font-serif">{idx + 1}</span>
              <Link href={`/admin/products/${p.productId}`} className="flex-1 min-w-0 hover:text-gold transition">
                <p className="text-sm truncate">{p.productName}</p>
                <p className="text-[11px] text-ink/40 font-mono">{p.productId}</p>
              </Link>
              <div className="text-right shrink-0">
                <p className="text-sm">{p.quantity}개</p>
                <p className="text-[11px] text-ink/40">₩{p.revenue.toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
