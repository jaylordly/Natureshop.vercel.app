import ProductForm from '../ProductForm';

export default function AdminProductNewPage() {
  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">New Product</p>
        <h1 className="font-serif text-3xl">새 상품 추가</h1>
      </div>
      <ProductForm mode="create" />
    </section>
  );
}
