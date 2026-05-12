'use client';
import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { listCustomers, updateCustomerRole, type Customer } from '@/lib/customers';
import { useToast } from '@/components/Toast';
import type { Role } from '@/lib/types';

const ROLE_BADGE: Record<Role, string> = {
  user: 'bg-cream text-ink/70',
  student: 'bg-gold/15 text-gold-dark',
  admin: 'bg-wine-dark/10 text-wine-dark',
};
const ROLE_LABEL: Record<Role, string> = {
  user: '일반',
  student: '수강생',
  admin: '관리자',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminCustomersPage() {
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const refresh = async () => {
    const all = await listCustomers();
    setCustomers(all);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleRoleChange = async (id: string, role: Role) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    if (!confirm(`${target.name}님의 권한을 ${ROLE_LABEL[role]}로 변경하시겠어요?`)) return;
    const { ok, error } = await updateCustomerRole(id, role);
    if (!ok) {
      show(`변경 실패: ${error}`, 'error');
      return;
    }
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, role } : c)));
    show(`${target.name}님의 권한을 ${ROLE_LABEL[role]}로 변경했습니다`, 'success');
  };

  const filtered = q.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.id.includes(q))
    : customers;

  const stats = {
    total: customers.length,
    admin: customers.filter((c) => c.role === 'admin').length,
    student: customers.filter((c) => c.role === 'student').length,
    user: customers.filter((c) => c.role === 'user').length,
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Customers</p>
        <h1 className="font-serif text-3xl">회원 관리</h1>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: '전체', value: stats.total },
          { label: '관리자', value: stats.admin },
          { label: '수강생', value: stats.student },
          { label: '일반', value: stats.user },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-gold/30 p-4">
            <p className="text-[10px] tracking-shop uppercase text-ink/50 mb-1">{s.label}</p>
            <p className="font-serif text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-gold/30 mb-4 px-4 py-3 flex items-center gap-2">
        <Search className="w-4 h-4 text-ink/40" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 또는 ID 검색"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">이름</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden md:table-cell">User ID</th>
                <th className="text-left px-3 sm:px-5 py-3">권한</th>
                <th className="text-right px-3 sm:px-5 py-3">주문</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden sm:table-cell">매출</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden md:table-cell">가입일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-ink/40">불러오는 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-ink/40">{q ? '검색 결과가 없습니다.' : '회원이 없습니다.'}</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-gold/15">
                    <td className="px-3 sm:px-5 py-3 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-ink/40" />
                      <span>{c.name}</span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 font-mono text-[10px] text-ink/40 hidden md:table-cell">{c.id.slice(0, 8)}...</td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${ROLE_BADGE[c.role]}`}>
                          {ROLE_LABEL[c.role]}
                        </span>
                        <select
                          value={c.role}
                          onChange={(e) => handleRoleChange(c.id, e.target.value as Role)}
                          className="text-[10px] bg-beige/50 border border-divider px-1 py-0.5 focus:outline-none"
                          aria-label="권한 변경"
                        >
                          <option value="user">일반</option>
                          <option value="student">수강생</option>
                          <option value="admin">관리자</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right">{c.orderCount}</td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap hidden sm:table-cell">₩{c.totalSpent.toLocaleString()}</td>
                    <td className="px-3 sm:px-5 py-3 text-right text-xs text-ink/50 hidden md:table-cell">{fmt(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
