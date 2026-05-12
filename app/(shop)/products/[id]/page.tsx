import type { Metadata } from 'next';
import { getProductByIdFromDb } from '@/lib/products';
import { notFound } from 'next/navigation';
import ProductDetailContent from './ProductDetailContent';
import RelatedProducts from '@/components/RelatedProducts';
import RecentlyViewedTracker from '@/components/RecentlyViewedTracker';
import RecentlyViewedSection from '@/components/RecentlyViewedSection';

export const dynamic = 'force-dynamic';

interface Params {
  params: { id: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProductByIdFromDb(params.id);
  if (!product) return { title: '상품을 찾을 수 없습니다' };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.description,
      url: `/products/${product.id}`,
      type: 'website',
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const product = await getProductByIdFromDb(params.id);
  if (!product) notFound();

  // schema.org Product JSON-LD — 검색 엔진 리치 결과용
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.id,
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KRW',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentlyViewedTracker productId={product.id} />
      <ProductDetailContent product={product} />
      <div className="container-narrow pb-16">
        <RelatedProducts category={product.category} excludeId={product.id} />
      </div>
      <RecentlyViewedSection excludeId={product.id} />
    </>
  );
}
