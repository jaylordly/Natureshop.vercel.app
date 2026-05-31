'use client';
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  createReturnRequest,
  getReturnByOrder,
  RETURN_REASONS,
  type ReturnRequest,
  type ReturnType,
} from '@/lib/returns';
import { useToast } from '@/components/Toast';

const STATUS_TEXT: Record<ReturnRequest['status'], string> = {
  requested: '접수됨 — 검토 중입니다',
  approved: '승인됨 — 처리 중입니다',
  rejected: '반려됨',
  completed: '처리 완료',
};

// 반품/교환 요청 가능한 주문 상태
const ELIGIBLE = ['paid', 'preparing', 'shipped', 'delivered'];

export default function ReturnRequestSection({ orderId, status }: { orderId: string; status: string }) {
  const { show } = useToast();
  const [existing, setExisting] = useState<ReturnRequest | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReturnType>('refund');
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getReturnByOrder(orderId);
      if (!cancelled) setExisting(r);
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  if (!ELIGIBLE.includes(status)) return null;
  if (existing === undefined) return null; // 로딩 중에는 표시 안 함

  const submit = async () => {
    setBusy(true);
    const { ok, error } = await createReturnRequest({ orderId, type, reason, detail: detail.trim() || undefined });
    setBusy(false);
    if (!ok) {
      show(`요청 실패: ${error}`, 'error');
      return;
    }
    show('반품/교환 요청이 접수되었습니다.', 'success');
    setOpen(false);
    const r = await getReturnByOrder(orderId);
    setExisting(r);
  };

  return (
    <div className="bg-card border border-gold/30 p-6 sm:p-8 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <RotateCcw className="w-4 h-4 text-gold-dark" />
        <h2 className="font-serif text-lg">반품 / 교환</h2>
      </div>

      {existing ? (
        <div className="text-sm">
          <p className="mb-1">
            <span className="text-ink/60">요청 유형 </span>
            {existing.type === 'refund' ? '환불' : '교환'} · <span className="text-ink/60">사유 </span>{existing.reason}
          </p>
          <p className="mb-1">
            <span className="text-ink/60">처리 상태 </span>
            <span className={existing.status === 'rejected' ? 'text-wine-dark' : 'text-gold-dark'}>
              {STATUS_TEXT[existing.status]}
            </span>
          </p>
          {existing.adminNote && (
            <p className="text-ink/70 mt-2 border-t border-gold/15 pt-2">관리자 메모: {existing.adminNote}</p>
          )}
        </div>
      ) : open ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['refund', 'exchange'] as ReturnType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 text-sm border transition ${type === t ? 'border-gold bg-gold/10 text-gold-dark' : 'border-divider hover:border-gold/40'}`}
              >
                {t === 'refund' ? '환불' : '교환'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">사유</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-beige border border-gold/30 px-3 py-2.5 text-sm focus:outline-none focus:border-gold"
            >
              {RETURN_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] tracking-shop uppercase text-ink/50 mb-1">상세 내용 (선택)</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="상세 사유를 입력해 주세요."
              className="w-full bg-beige border border-gold/30 px-3 py-2.5 text-sm focus:outline-none focus:border-gold resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="flex-1 bg-ink text-beige py-3 text-xs tracking-cta uppercase hover:bg-gold hover:text-ink transition disabled:opacity-40"
            >
              {busy ? '접수 중…' : '요청 접수'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 border border-gold/40 text-xs tracking-cta uppercase hover:bg-ink hover:text-beige transition"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-ink/60 mb-4">상품에 문제가 있거나 변심하셨다면 환불/교환을 요청하실 수 있습니다.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 border border-gold/40 px-4 py-2.5 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition"
          >
            환불 / 교환 요청
          </button>
        </div>
      )}
    </div>
  );
}
