'use client';
import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { listOrdersFromDb } from '@/lib/orders';
import { getStatsSnapshot, type StatsSnapshot } from '@/lib/admin-analytics';

const EMPTY: StatsSnapshot = {
  todayCount: 0,
  todayRevenue: 0,
  totalCount: 0,
  totalRevenue: 0,
  paidCount: 0,
  avgOrderValue: 0,
};

export default function StatsCards() {
  const [stats, setStats] = useState<StatsSnapshot>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const orders = await listOrdersFromDb();
      if (!cancelled) setStats(getStatsSnapshot(orders));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      label: '오늘 주문',
      value: `${stats.todayCount}건`,
      sub: stats.todayCount === 0 ? '오늘은 아직 없어요' : `오늘 매출 ₩${stats.todayRevenue.toLocaleString()}`,
      Icon: ShoppingCart,
    },
    {
      label: '오늘 매출',
      value: `₩${stats.todayRevenue.toLocaleString()}`,
      sub: stats.todayCount > 0 ? `평균 ₩${Math.round(stats.todayRevenue / stats.todayCount).toLocaleString()}` : '결제 대기 중',
      Icon: DollarSign,
    },
    {
      label: '누적 주문',
      value: `${stats.totalCount}건`,
      sub: `결제완료 ${stats.paidCount}건 · 데모 ${stats.totalCount - stats.paidCount}건`,
      Icon: BarChart3,
    },
    {
      label: '누적 매출',
      value: `₩${stats.totalRevenue.toLocaleString()}`,
      sub: stats.avgOrderValue > 0 ? `평균 객단가 ₩${stats.avgOrderValue.toLocaleString()}` : '주문 데이터 없음',
      Icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {cards.map(({ label, value, sub, Icon }) => (
        <div key={label} className="bg-card border border-gold/30 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] tracking-shop uppercase text-ink/50">{label}</p>
            <Icon className="w-4 h-4 text-gold" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl tracking-tight mb-1">{value}</p>
          <p className="text-xs text-ink/50">{sub}</p>
        </div>
      ))}
    </div>
  );
}
