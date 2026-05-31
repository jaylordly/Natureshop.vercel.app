'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { getAllProductsFromDb, upsertProductInDb } from '@/lib/products';
import type { Product } from '@/lib/types';
import { TableRowSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

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
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pct, setPct] = useState('');
  const [vis, setVis] = useState<Product['visibility']>('public');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const all = await getAllProductsFromDb();
    setProducts(all);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  };

  const applyToSelected = async (transform: (p: Product) => Product, label: string) => {
    const targets = products.filter((p) => selected.has(p.id));
    if (targets.length === 0) return;
    setBusy(true);
    let failed = 0;
    for (const p of targets) {
      const { ok } = await upsertProductInDb(transform(p));
      if (!ok) failed++;
    }
    setBusy(false);
    await refresh();
    setSelected(new Set());
    show(failed ? `${label}: ${targets.length - failed}건 성공, ${failed}건 실패` : `${label}: ${targets.length}건 적용됨`, failed ? 'error' : 'success');
  };

  const applyPrice = () => {
    const p = Number(pct);
    if (!Number.isFinite(p) || p === 0) { show('변동률(%)을 입력해 주세요. 예: 10 또는 -10', 'error'); return; }
    if (!confirm(`선택한 ${selected.size}개 상품 가격을 ${p > 0 ? '+' : ''}${p}% 조정할까요?`)) return;
    void applyToSelected(
      (prod) => ({ ...prod, price: Math.max(0, Math.round(prod.price * (1 + p / 100))) }),
      `가격 ${p > 0 ? '+' : ''}${p}%`,
    );
    setPct('');
  };

  const applyVisibility = () => {
    if (!confirm(`선택한 ${selected.size}개 상품 공개범위를 '${VIS_LABEL[vis]}'(으)로 변경할까요?`)) return;
    void applyToSelected((prod) => ({ ...prod, visibility: vis }), `공개범위 → ${VIS_LABEL[vis]}`);
  };

  const allChecked = products.length > 0 && selected.size === products.length;

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

      {/* 일괄 편집 바 */}
      {selected.size > 0 && (
        <div className="bg-beige border border-gold/40 p-4 mb-4 flex flex-wrap items-end gap-4">
          <span className="text-sm font-medium text-gold-dark">{selected.size}개 선택됨</span>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">가격 변동 %</label>
              <input
                value={pct}
                onChange={(e) => setPct(e.target.value)}
                placeholder="예: 10, -10"
                className="w-28 bg-card border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <button onClick={applyPrice} disabled={busy} className="border border-gold/40 px-3 py-2 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40">
              가격 적용
            </button>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">공개범위</label>
              <select value={vis} onChange={(e) => setVis(e.target.value as Product['visibility'])} className="bg-card border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:border-gold">
                <option value="public">전체</option>
                <option value="student">수강생</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            <button onClick={applyVisibility} disabled={busy} className="border border-gold/40 px-3 py-2 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40">
              공개범위 적용
            </button>
          </div>
          {busy && <span className="text-xs text-ink/50">적용 중…</span>}
        </div>
      )}

      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="px-3 sm:px-5 py-3 w-8">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-ink" aria-label="전체 선택" />
                </th>
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
                  {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)}
                </>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-ink/40">상품이 없습니다.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={`border-t border-gold/15 ${selected.has(p.id) ? 'bg-gold/5' : ''}`}>
                    <td className="px-3 sm:px-5 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="accent-ink" aria-label={`${p.name} 선택`} />
                    </td>
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
