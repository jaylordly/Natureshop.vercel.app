'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { listOrdersFromDb } from '@/lib/orders';
import { getOrdersByDay, type DayPoint } from '@/lib/admin-analytics';

/**
 * 방문자 트래킹은 별도 인프라(Plausible/Vercel Analytics)가 붙기 전까지
 * 실제 데이터로 채우기 어렵기 때문에, 같은 자리를 일별 주문 추이로 운영합니다.
 */
export default function VisitorChart() {
  const [data, setData] = useState<DayPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const orders = await listOrdersFromDb();
      if (!cancelled) setData(getOrdersByDay(orders, 14));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="bg-card border border-gold/30 p-6">
      <p className="text-[11px] tracking-shop uppercase text-ink/50 mb-4">최근 14일 일별 주문</p>
      <div className="h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#E7DDCD" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#7A6A55" fontSize={11} />
              <YAxis stroke="#7A6A55" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#FFFDF9', border: '1px solid #B5894A', fontSize: 12 }}
                formatter={(v: number, _n, item) => [`${v}건 · ₩${(item.payload.revenue || 0).toLocaleString()}`, '주문']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#B5894A"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="w-6 h-6 rounded-full bg-ink/5 mx-auto mb-3" />
              <p className="text-sm text-ink/50 mb-1">최근 14일 주문이 없어요</p>
              <p className="text-xs text-ink/40">/checkout에서 결제를 완료하면 여기에 표시됩니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
