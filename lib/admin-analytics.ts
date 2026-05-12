import type { OrderStatus } from './orders';

type Order = { total: number; status: OrderStatus; createdAt: number };

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isPaidOrDemo(o: Order): boolean {
  return o.status === 'paid' || o.status === 'demo';
}

export interface StatsSnapshot {
  todayCount: number;
  todayRevenue: number;
  totalCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  paidCount: number;
}

export function getStatsSnapshot(orders: Order[]): StatsSnapshot {
  const todayStart = startOfDay(Date.now());
  let todayCount = 0;
  let todayRevenue = 0;
  let totalCount = 0;
  let totalRevenue = 0;
  let paidCount = 0;

  for (const o of orders) {
    if (!isPaidOrDemo(o)) continue;
    totalCount++;
    totalRevenue += o.total;
    if (o.status === 'paid') paidCount++;
    if (o.createdAt >= todayStart) {
      todayCount++;
      todayRevenue += o.total;
    }
  }

  return {
    todayCount,
    todayRevenue,
    totalCount,
    totalRevenue,
    paidCount,
    avgOrderValue: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
  };
}

export interface DayPoint {
  /** MM/DD */
  label: string;
  /** Date.getTime() at start of day */
  ts: number;
  count: number;
  revenue: number;
}

export function getOrdersByDay(orders: Order[], days = 14): DayPoint[] {
  const todayStart = startOfDay(Date.now());
  const buckets: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = todayStart - i * DAY_MS;
    const d = new Date(ts);
    buckets.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      ts,
      count: 0,
      revenue: 0,
    });
  }

  for (const o of orders) {
    if (!isPaidOrDemo(o)) continue;
    const dayStart = startOfDay(o.createdAt);
    const idx = Math.round((dayStart - buckets[0].ts) / DAY_MS);
    if (idx < 0 || idx >= buckets.length) continue;
    buckets[idx].count++;
    buckets[idx].revenue += o.total;
  }

  return buckets;
}

export interface WeekPoint {
  label: string;
  revenue: number;
  count: number;
}

export function getRevenueByWeek(orders: Order[], weeks = 4): WeekPoint[] {
  const todayStart = startOfDay(Date.now());
  // 주 단위 = 7일. 가장 오래된 버킷이 [0], 최신이 [weeks-1]
  const buckets: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ label: i === 0 ? '이번 주' : `${i}주 전`, revenue: 0, count: 0 });
  }

  for (const o of orders) {
    if (!isPaidOrDemo(o)) continue;
    const ageDays = Math.floor((todayStart - startOfDay(o.createdAt)) / DAY_MS);
    if (ageDays < 0) continue;
    const wk = Math.floor(ageDays / 7);
    if (wk >= weeks) continue;
    const idx = weeks - 1 - wk; // 최신이 마지막
    buckets[idx].revenue += o.total;
    buckets[idx].count++;
  }

  return buckets;
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  if (diff < 60_000) return '방금';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}일 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
