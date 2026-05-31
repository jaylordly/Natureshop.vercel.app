import { Check, Clock, XCircle, Sparkles, Package, Truck, Home, RotateCcw } from 'lucide-react';
import type { OrderStatus } from '@/lib/status-style';

interface Step {
  key: OrderStatus;
  label: string;
  Icon: React.ElementType;
}

// 배송 라이프사이클 (결제완료 이후)
const STEPS: Step[] = [
  { key: 'paid', label: '결제 완료', Icon: Check },
  { key: 'preparing', label: '배송 준비', Icon: Package },
  { key: 'shipped', label: '배송 중', Icon: Truck },
  { key: 'delivered', label: '배송 완료', Icon: Home },
];

const SINGLE: Partial<Record<OrderStatus, { step: Step; accent: string }>> = {
  pending: { step: { key: 'pending', label: '입금 대기', Icon: Clock }, accent: 'bg-espresso text-beige' },
  failed: { step: { key: 'failed', label: '결제 실패', Icon: XCircle }, accent: 'bg-wine-dark text-beige' },
  demo: { step: { key: 'demo', label: '데모 주문', Icon: Sparkles }, accent: 'bg-ink text-beige' },
  refunding: { step: { key: 'refunding', label: '환불 처리 중', Icon: RotateCcw }, accent: 'bg-espresso text-beige' },
  refunded: { step: { key: 'refunded', label: '환불 완료', Icon: RotateCcw }, accent: 'bg-ink/60 text-beige' },
};

export default function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const single = SINGLE[status];
  if (single) {
    return <SingleStep step={single.step} active accent={single.accent} />;
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center justify-between gap-1 sm:gap-3">
      {STEPS.map((s, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={s.key} className="flex-1 flex items-center gap-1 sm:gap-3 min-w-0">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                done
                  ? active
                    ? 'bg-gold text-beige border-gold'
                    : 'bg-gold/15 text-gold-dark border-gold/30'
                  : 'bg-card text-ink/30 border-divider'
              }`}>
                <s.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className={`text-[10px] sm:text-xs tracking-shop uppercase mt-1.5 truncate ${done ? 'text-ink/80' : 'text-ink/40'}`}>
                {s.label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-gold/40' : 'bg-divider'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SingleStep({ step, active, accent }: { step: Step; active: boolean; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? accent : 'bg-card text-ink/30 border border-divider'}`}>
        <step.Icon className="w-5 h-5" />
      </div>
      <p className="text-sm tracking-shop">{step.label}</p>
    </div>
  );
}
