'use client';
import { useEffect, useState } from 'react';
import { Plus, Power, Trash2, Ticket } from 'lucide-react';
import { listCoupons, createCoupon, toggleCoupon, deleteCoupon, type Coupon, type CouponType } from '@/lib/coupons';
import { useToast } from '@/components/Toast';
import { TextField } from '@/components/TextField';

function fmtValue(c: Coupon) {
  if (c.type === 'fixed') return `₩${c.value.toLocaleString()}`;
  return `${c.value}%`;
}

export default function AdminCouponsPage() {
  const { show } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CouponType>('fixed');
  const [value, setValue] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setCoupons(await listCoupons());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;
    const numValue = Number(value);
    if (type === 'percent' && (numValue < 1 || numValue > 100)) {
      show('정률 쿠폰은 1~100 사이여야 합니다.', 'error');
      return;
    }
    setBusy(true);
    const { ok, error } = await createCoupon({
      code: code.trim().toUpperCase(),
      label: label.trim() || undefined,
      type,
      value: numValue,
      minOrderAmount: minAmount ? Number(minAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
    });
    setBusy(false);
    if (!ok) {
      show(`추가 실패: ${error}`, 'error');
      return;
    }
    show('쿠폰을 추가했습니다.', 'success');
    setCode('');
    setLabel('');
    setValue('');
    setMinAmount('');
    setMaxUses('');
    void refresh();
  };

  const handleToggle = async (c: Coupon) => {
    await toggleCoupon(c.code, !c.active);
    show(`${c.code} ${c.active ? '비활성화' : '활성화'}`, 'info');
    void refresh();
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`쿠폰 "${c.code}"를 삭제하시겠어요?`)) return;
    await deleteCoupon(c.code);
    show('쿠폰 삭제됨', 'info');
    void refresh();
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Coupons</p>
        <h1 className="font-serif text-3xl">쿠폰 관리</h1>
      </div>

      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-lg">새 쿠폰 만들기</h2>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextField label="코드" htmlFor="cp-code">
            <input id="cp-code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none font-mono" />
          </TextField>
          <TextField label="메모" htmlFor="cp-label">
            <input id="cp-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="신규가입 환영" className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
          </TextField>
          <TextField label="할인 유형" htmlFor="cp-type">
            <select id="cp-type" value={type} onChange={(e) => setType(e.target.value as CouponType)} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none">
              <option value="fixed">정액 할인 (₩)</option>
              <option value="percent">정률 할인 (%)</option>
            </select>
          </TextField>
          <TextField label={type === 'fixed' ? '할인 금액 (원)' : '할인율 (%)'} htmlFor="cp-value">
            <input id="cp-value" type="number" required min={1} max={type === 'percent' ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
          </TextField>
          <TextField label="최소 주문 금액 (선택)" htmlFor="cp-min">
            <input id="cp-min" type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
          </TextField>
          <TextField label="최대 사용 횟수 (비우면 무제한)" htmlFor="cp-max">
            <input id="cp-max" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
          </TextField>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" disabled={busy} className="flex items-center gap-2 bg-ink text-beige px-5 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40">
              <Plus className="w-4 h-4" /> {busy ? '추가 중...' : '쿠폰 추가'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">코드</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden sm:table-cell">메모</th>
                <th className="text-right px-3 sm:px-5 py-3">할인</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden md:table-cell">최소주문</th>
                <th className="text-right px-3 sm:px-5 py-3">사용</th>
                <th className="text-left px-3 sm:px-5 py-3">상태</th>
                <th className="text-right px-3 sm:px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-ink/40">불러오는 중...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-ink/40">쿠폰이 없습니다.</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.code} className="border-t border-gold/15">
                    <td className="px-3 sm:px-5 py-3 font-mono"><Ticket className="w-3.5 h-3.5 text-gold inline mr-1" />{c.code}</td>
                    <td className="px-3 sm:px-5 py-3 text-ink/70 hidden sm:table-cell">{c.label || '—'}</td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">{fmtValue(c)}</td>
                    <td className="px-3 sm:px-5 py-3 text-right text-ink/60 hidden md:table-cell">{c.minOrderAmount > 0 ? `₩${c.minOrderAmount.toLocaleString()}` : '—'}</td>
                    <td className="px-3 sm:px-5 py-3 text-right">{c.usedCount}{c.maxUses != null && <span className="text-ink/40"> / {c.maxUses}</span>}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${c.active ? 'bg-gold/15 text-gold-dark' : 'bg-ink/5 text-ink/50'}`}>
                        {c.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => handleToggle(c)} className="text-ink/70 hover:text-gold transition mr-3"><Power className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c)} className="text-red-500 hover:text-red-700 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
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
