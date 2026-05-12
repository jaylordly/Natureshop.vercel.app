'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProductByIdFromDb } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductForm from '../ProductForm';
import StockHistorySection from '@/components/admin/StockHistorySection';
import GallerySection from '../GallerySection';

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const p = await getProductByIdFromDb(id);
      setProduct(p ?? null);
    })();
  }, [id]);

  if (product === undefined) {
    return <section className="container-narrow py-10 text-ink/40">불러오는 중...</section>;
  }
  if (product === null) {
    return <section className="container-narrow py-10 text-ink/60">상품을 찾을 수 없어요.</section>;
  }

  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Edit Product</p>
        <h1 className="font-serif text-3xl">상품 수정</h1>
      </div>
      <ProductForm mode="edit" initial={product} />
      <GallerySection productId={product.id} />
      <StockHistorySection productId={product.id} />
    </section>
  );
}
