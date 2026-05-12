'use client';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addToWishlist, removeFromWishlist, listWishlist } from '@/lib/wishlist';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';

export default function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.id.startsWith('demo-')) {
      setActive(false);
      return;
    }
    (async () => {
      const list = await listWishlist();
      setActive(list.includes(productId));
    })();
  }, [user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.id.startsWith('demo-')) {
      router.push('/login?redirect=/products');
      return;
    }
    setBusy(true);
    if (active) {
      await removeFromWishlist(productId);
      setActive(false);
      show('찜에서 제거', 'info');
    } else {
      await addToWishlist(productId);
      setActive(true);
      show('찜에 추가', 'success');
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={active ? '찜 해제' : '찜하기'}
      className={`transition ${active ? 'text-wine-dark' : 'text-ink/40 hover:text-wine-dark'} ${className ?? ''}`}
    >
      <Heart className={`w-5 h-5 ${active ? 'fill-wine-dark' : ''}`} />
    </button>
  );
}
