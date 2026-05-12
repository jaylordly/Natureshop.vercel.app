'use client';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LogEntry {
  id: string;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: number;
}

const ACTION_LABEL: Record<string, string> = {
  'order.refund': '주문 환불',
  'product.create': '상품 추가',
  'product.update': '상품 수정',
  'product.delete': '상품 삭제',
  'role.change': '권한 변경',
  'coupon.create': '쿠폰 생성',
  'coupon.delete': '쿠폰 삭제',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs(
        (data ?? []).map((r) => ({
          id: r.id,
          actorName: r.actor_name,
          action: r.action,
          targetType: r.target_type,
          targetId: r.target_id,
          details: r.details,
          createdAt: new Date(r.created_at).getTime(),
        })),
      );
      setLoading(false);
    })();
  }, []);

  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Activity Log</p>
        <h1 className="font-serif text-3xl">활동 로그</h1>
        <p className="text-ink/60 text-sm mt-2">관리자 액션이 모두 기록됩니다. 최근 100건.</p>
      </div>

      <div className="bg-card border border-gold/30">
        {loading ? (
          <p className="text-center py-12 text-ink/40">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-7 h-7 text-ink/15 mx-auto mb-3" />
            <p className="text-sm text-ink/50">아직 기록된 활동이 없어요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/15">
            {logs.map((l) => (
              <li key={l.id} className="px-5 py-4 flex items-start gap-3">
                <Activity className="w-3.5 h-3.5 text-gold mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{l.actorName ?? '시스템'}</span>
                    <span className="text-ink/60"> · {ACTION_LABEL[l.action] ?? l.action}</span>
                    {l.targetId && <span className="text-ink/40 font-mono text-xs ml-2">{l.targetId}</span>}
                  </p>
                  {l.details && Object.keys(l.details).length > 0 && (
                    <p className="text-[11px] text-ink/50 mt-0.5 break-all">{JSON.stringify(l.details)}</p>
                  )}
                </div>
                <p className="text-xs text-ink/40 shrink-0 whitespace-nowrap">{fmt(l.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
