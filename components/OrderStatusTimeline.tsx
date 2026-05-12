import { Check, Clock, XCircle, Sparkles } from 'lucide-react';
import type { OrderStatus } from '@/lib/status-style';

interface Step {
  key: OrderStatus;
  label: string;
  Icon: React.ElementType;
}

const STEPS: Step[] = [
  { key: 'pending', label: '결제 대기', Icon: Clock },
  { key: 'paid', label: '결제 완료', Icon: Check },
];

const FAILED_STEP: Step = { key: 'failed', label: '결제 실패', Icon: XCircle };
const DEMO_STEP: Step = { key: 'demo', label: '데모 주문', Icon: Sparkles };

export default function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'failed') {
    return <SingleStep step={FAILED_STEP} active accent="bg-wine-dark text-beige" />;
  }
  if (status === 'demo') {
    return <SingleStep step={DEMO_STEP} active accent="bg-ink text-beige" />;
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex items-center justify-between gap-2 sm:gap-4">
      {STEPS.map((s, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={s.key} className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
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
