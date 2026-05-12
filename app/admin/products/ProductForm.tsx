'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { upsertProductInDb, deleteProductFromDb } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import type { Product, ProductCategory, Visibility } from '@/lib/types';
import { TextField } from '@/components/TextField';

const CATEGORIES: ProductCategory[] = ['머신', '엠보', '색소', '위생', '케어'];
const VISIBILITIES: Visibility[] = ['public', 'student', 'admin'];

interface Props {
  initial?: Product;
  mode: 'create' | 'edit';
}

export default function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<string>(
    initial?.originalPrice ? String(initial.originalPrice) : ''
  );
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [category, setCategory] = useState<ProductCategory>(initial?.category ?? '머신');
  const [image, setImage] = useState(initial?.image ?? '');
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? 'public');
  const [isBest, setIsBest] = useState(initial?.isBest ?? false);
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr('');
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    setUploading(false);
    if (error) {
      setErr(`업로드 실패: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    setImage(data.publicUrl);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const op = originalPrice ? Number(originalPrice) : null;
    const product: Product = {
      id: id.trim(),
      name: name.trim(),
      description: description.trim(),
      price,
      originalPrice: op && op > price ? op : null,    // 정가가 판매가보다 클 때만 의미
      stock,
      category,
      image: image.trim(),
      visibility,
      isBest,
      isNew,
    };
    const { ok, error } = await upsertProductInDb(product);
    setBusy(false);
    if (!ok) {
      setErr(error || '저장에 실패했습니다.');
      return;
    }
    router.push('/admin/products');
    router.refresh();
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm(`"${initial.name}"을(를) 삭제하시겠어요? 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const { ok, error } = await deleteProductFromDb(initial.id);
    setBusy(false);
    if (!ok) {
      setErr(error || '삭제에 실패했습니다.');
      return;
    }
    router.push('/admin/products');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-gold transition mb-2">
        <ArrowLeft className="w-3.5 h-3.5" /> 상품 목록
      </Link>

      <TextField label="상품 ID (영문/숫자, 예: p-012)" htmlFor="p-id">
        <input
          id="p-id"
          type="text"
          required
          disabled={mode === 'edit'}
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
        />
      </TextField>

      <TextField label="상품명" htmlFor="p-name">
        <input
          id="p-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
        />
      </TextField>

      <TextField label="설명" htmlFor="p-desc">
        <textarea
          id="p-desc"
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none resize-none"
        />
      </TextField>

      <div className="grid grid-cols-3 gap-4">
        <TextField label="판매가 (원)" htmlFor="p-price">
          <input
            id="p-price"
            type="number"
            required
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
        </TextField>
        <TextField label="정가 (선택, 할인 표시용)" htmlFor="p-orig">
          <input
            id="p-orig"
            type="number"
            min={0}
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="비우면 할인 X"
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
        </TextField>
        <TextField label="재고" htmlFor="p-stock">
          <input
            id="p-stock"
            type="number"
            required
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
        </TextField>
      </div>
      {originalPrice && Number(originalPrice) > price && price > 0 && (
        <p className="text-[11px] text-gold-dark">
          ✓ {Math.round((1 - price / Number(originalPrice)) * 100)}% 할인 표시됨
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <TextField label="카테고리" htmlFor="p-cat">
          <select
            id="p-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </TextField>
        <TextField label="공개 범위" htmlFor="p-vis">
          <select
            id="p-vis"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          >
            <option value="public">전체 공개</option>
            <option value="student">수강생 전용</option>
            <option value="admin">관리자 전용</option>
          </select>
        </TextField>
      </div>

      <div>
        <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">이미지</label>
        <div className="flex gap-3 items-start">
          {image && (
            <div className="w-24 h-24 bg-beige border border-gold/30 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="미리보기" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 border border-gold/40 px-3 py-2 text-xs tracking-shop hover:bg-ink hover:text-beige transition disabled:opacity-40"
              >
                {uploading ? <Upload className="w-3.5 h-3.5 animate-pulse" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? '업로드 중...' : '파일 업로드'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleUpload}
                className="hidden"
              />
              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="inline-flex items-center gap-1 border border-divider px-3 py-2 text-xs text-ink/60 hover:text-red-600 transition"
                >
                  비우기
                </button>
              )}
            </div>
            <div className="border border-gold/25">
              <input
                id="p-img"
                type="url"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="또는 이미지 URL 직접 입력"
                className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-ink/40">PNG/JPG/WebP/GIF, 최대 5MB</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 text-sm pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isBest} onChange={(e) => setIsBest(e.target.checked)} className="accent-ink" />
          베스트 표시
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="accent-ink" />
          신상품 표시
        </label>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 bg-ink text-beige px-6 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {busy ? '저장 중...' : mode === 'create' ? '추가하기' : '저장'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex items-center gap-2 border border-red-300 text-red-600 px-6 py-3 text-sm hover:bg-red-50 transition disabled:opacity-50 ml-auto"
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </button>
        )}
      </div>
    </form>
  );
}
