'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { listProductImages } from '@/lib/product-images';

interface Props {
  productId: string;
  coverImage: string;
  coverAlt: string;
}

export default function ProductGallery({ productId, coverImage, coverAlt }: Props) {
  const [images, setImages] = useState<string[]>([coverImage]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const gallery = await listProductImages(productId);
      const urls = [coverImage, ...gallery.map((g) => g.url).filter((u) => u !== coverImage)];
      setImages(urls);
    })();
  }, [productId, coverImage]);

  return (
    <div>
      <div className="aspect-square relative bg-card border border-gold/20 mb-3">
        <Image
          key={images[activeIdx]}
          src={images[activeIdx]}
          alt={coverAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((url, idx) => (
            <button
              key={url + idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative aspect-square bg-card border-2 overflow-hidden ${activeIdx === idx ? 'border-gold' : 'border-gold/20 hover:border-gold/50'}`}
              aria-label={`이미지 ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
