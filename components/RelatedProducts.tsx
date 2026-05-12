import ProductCard from './ProductCard';
import { getAllProductsFromDb } from '@/lib/products';

export default async function RelatedProducts({
  category,
  excludeId,
}: {
  category: string;
  excludeId: string;
}) {
  const all = await getAllProductsFromDb();
  const related = all.filter((p) => p.category === category && p.id !== excludeId && p.visibility === 'public').slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="border-t border-gold/30 mt-12 pt-12">
      <div className="mb-6">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Related</p>
        <h2 className="font-serif text-2xl">같은 카테고리 상품</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
