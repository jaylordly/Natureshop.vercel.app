import StatsCards from '@/components/admin/StatsCards';
import VisitorChart from '@/components/admin/VisitorChart';
import RevenueChart from '@/components/admin/RevenueChart';
import OrdersTable from '@/components/admin/OrdersTable';
import ActivityFeed from '@/components/admin/ActivityFeed';
import TopProducts from '@/components/admin/TopProducts';
import LowStockAlert from '@/components/admin/LowStockAlert';

export const metadata = { title: '관리자 — The Nature Academy' };

export default function AdminPage() {
  return (
    <div className="container-narrow py-10">
      <h1 className="font-serif text-3xl mb-2">대시보드</h1>
      <p className="text-ink/60 mb-2 text-sm">방문자, 매출, 주문, 사용자 활동</p>
      <p className="text-[10px] tracking-cta uppercase text-espresso mb-10">데모 데이터</p>
      <StatsCards />
      <LowStockAlert />
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <VisitorChart />
        <RevenueChart />
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <ActivityFeed />
        <TopProducts />
      </div>
      <OrdersTable />
    </div>
  );
}
