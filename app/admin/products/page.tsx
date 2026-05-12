'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getAllProductsFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';
import { TableRowSkeleton } from '@/components/Skeleton';

const VIS_BADGE: Record<string, string> = {
  public: 'bg-cream text-ink/70',
  student: 'bg-gold/15 text-gold-dark',
  admin: 'bg-wine-dark/10 text-wine-dark',
};
const VIS_LABEL: Record<string, string> = {
  public: '전체',
  student: '수강생',
  admin: '관리자',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await getAllProductsFromDb();
      setProducts(all);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="container-narrow py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Catalog</p>
          <h1 className="font-serif text-3xl">상품 관리</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-ink text-beige px-5 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
        >
          <Plus className="w-4 h-4" /> 새 상품
        </Link>
      </div>

      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">ID</th>
                <th className="text-left px-3 sm:px-5 py-3">상품명</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden sm:table-cell">카테고리</th>
                <th className="text-right px-3 sm:px-5 py-3">가격</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden sm:table-cell">재고</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden md:table-cell">공개</th>
                <th className="text-right px-3 sm:px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)}
                </>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-ink/40">상품이 없습니다.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-t border-gold/15">
                    <td className="px-3 sm:px-5 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        {p.isBest && <span className="text-[9px] tracking-cta uppercase text-gold-dark bg-gold/10 px-1.5 py-0.5">Best</span>}
                        {p.isNew && <span className="text-[9px] tracking-cta uppercase text-wine-dark bg-wine-dark/10 px-1.5 py-0.5">New</span>}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-ink/70 hidden sm:table-cell">{p.category}</td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">₩{p.price.toLocaleString()}</td>
                    <td className="px-3 sm:px-5 py-3 text-right hidden sm:table-cell">{p.stock}</td>
                    <td className="px-3 sm:px-5 py-3 hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${VIS_BADGE[p.visibility]}`}>
                        {VIS_LABEL[p.visibility]}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-ink/70 hover:text-gold transition"
                      >
                        <Pencil className="w-3.5 h-3.5" /> 수정
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
