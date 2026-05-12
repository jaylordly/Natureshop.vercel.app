'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Trash2, Upload, Plus } from 'lucide-react';
import { listProductImages, addProductImage, deleteProductImage, type ProductImage } from '@/lib/product-images';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function GallerySection({ productId }: { productId: string }) {
  const { show } = useToast();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setImages(await listProductImages(productId));
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [productId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `gallery/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) {
      setUploading(false);
      show(`업로드 실패: ${error.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    await addProductImage(productId, data.publicUrl, images.length);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    show('이미지 추가됨', 'success');
    void refresh();
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    const { ok, error } = await addProductImage(productId, urlInput.trim(), images.length);
    if (!ok) {
      show(`추가 실패: ${error}`, 'error');
      return;
    }
    setUrlInput('');
    show('이미지 추가됨', 'success');
    void refresh();
  };

  const handleDelete = async (img: ProductImage) => {
    if (!confirm('이 이미지를 삭제하시겠어요?')) return;
    await deleteProductImage(img.id);
    show('삭제됨', 'info');
    void refresh();
  };

  return (
    <div className="mt-8 border-t border-gold/20 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg">추가 이미지 갤러리</h2>
        <span className="text-xs text-ink/40">{loading ? '' : `${images.length}장`}</span>
      </div>
      <p className="text-xs text-ink/60 mb-4">상품 상세 페이지에서 메인 이미지 외에 추가로 보여줄 사진들이에요. (위 cover 이미지가 메인)</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 border border-gold/40 px-3 py-2 text-xs tracking-shop hover:bg-ink hover:text-beige transition disabled:opacity-40"
        >
          <Upload className="w-3.5 h-3.5" /> {uploading ? '업로드 중...' : '파일 업로드'}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUpload} className="hidden" />
        <div className="flex gap-1 flex-1 min-w-[200px]">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="또는 이미지 URL"
            className="flex-1 border border-gold/25 bg-transparent px-3 py-2 text-xs focus:outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="border border-gold/40 px-3 py-2 text-xs hover:bg-ink hover:text-beige transition disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40 py-6 text-center">불러오는 중...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-ink/40 py-6 text-center">추가 이미지가 없어요</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square bg-beige border border-gold/20 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(img)}
                className="absolute top-1 right-1 bg-ink/80 text-beige p-1 opacity-0 group-hover:opacity-100 transition"
                aria-label="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
