'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { listOrdersFromDb } from '@/lib/orders';
import { getRevenueByWeek, type WeekPoint } from '@/lib/admin-analytics';

export default function RevenueChart() {
  const [data, setData] = useState<WeekPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const orders = await listOrdersFromDb();
      if (!cancelled) setData(getRevenueByWeek(orders, 4));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="bg-card border border-gold/30 p-6">
      <p className="text-[11px] tracking-shop uppercase text-ink/50 mb-4">최근 4주 매출</p>
      <div className="h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#E7DDCD" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#7A6A55" fontSize={11} />
              <YAxis
                stroke="#7A6A55"
                fontSize={11}
                tickFormatter={(v) => (v >= 10000 ? `${Math.round(v / 10000)}만` : v.toString())}
              />
              <Tooltip
                contentStyle={{ background: '#FFFDF9', border: '1px solid #B5894A', fontSize: 12 }}
                formatter={(v: number, _n, item) => [`₩${v.toLocaleString()} · ${item.payload.count}건`, '매출']}
              />
              <Bar dataKey="revenue" fill="#B5894A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="w-6 h-6 rounded-full bg-ink/5 mx-auto mb-3" />
              <p className="text-sm text-ink/50 mb-1">아직 매출 데이터가 없어요</p>
              <p className="text-xs text-ink/40">결제가 완료되면 자동으로 집계됩니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
