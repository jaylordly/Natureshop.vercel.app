'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';

/**
 * 관리자가 로그인한 상태에서 새 주문이 들어오면 토스트로 알림.
 * Supabase Realtime의 postgres_changes를 통해 INSERT 이벤트를 수신.
 */
export default function AdminLiveNotifier() {
  const { user } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin' || user.id.startsWith('demo-')) return;

    const channel = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const row = payload.new as { id: string; total: number; shipping_name: string };
          show(`새 주문! ${row.shipping_name}님 ₩${row.total.toLocaleString()}`, 'success');
          // 클릭으로 이동 가능하면 좋겠지만, 토스트 자체 click 핸들러는 단순화 차원에서 미적용
          // 대신 잠시 후 라우터 prefetch
          router.prefetch(`/admin/orders/${row.id}`);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user, show, router]);

  return null;
}
