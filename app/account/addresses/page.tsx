'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { listAddresses, createAddress, setDefaultAddress, deleteAddress, type Address } from '@/lib/addresses';
import { useToast } from '@/components/Toast';
import { TextField } from '@/components/TextField';

export default function AddressesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ready, setReady] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '집', name: '', phone: '', address: '', isDefault: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.id.startsWith('demo-'))) {
      router.push('/login?redirect=/account/addresses');
    }
  }, [loading, user, router]);

  const refresh = async () => {
    setAddresses(await listAddresses());
    setReady(true);
  };

  useEffect(() => {
    if (user && !user.id.startsWith('demo-')) void refresh();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { ok, error } = await createAddress(form);
    setBusy(false);
    if (!ok) {
      show(error || '추가 실패', 'error');
      return;
    }
    show('주소를 추가했습니다', 'success');
    setForm({ label: '집', name: '', phone: '', address: '', isDefault: false });
    setShowForm(false);
    void refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 주소를 삭제하시겠어요?')) return;
    await deleteAddress(id);
    show('주소 삭제됨', 'info');
    void refresh();
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
    show('기본 배송지로 설정됨', 'success');
    void refresh();
  };

  if (!user || user.id.startsWith('demo-')) {
    return <section className="container-narrow py-24 text-center text-ink/40">불러오는 중...</section>;
  }

  return (
    <section className="container-narrow py-12 max-w-2xl">
      <Link href="/account" className="text-xs text-ink/60 hover:text-gold transition">← 내 계정</Link>
      <div className="my-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">My Addresses</p>
          <h1 className="font-serif text-3xl flex items-center gap-2">
            <MapPin className="w-7 h-7 text-gold" /> 배송지 관리
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition"
          >
            <Plus className="w-4 h-4" /> 새 주소
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-gold/30 p-6 mb-6">
          <h2 className="font-serif text-lg mb-4">새 주소 추가</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="별칭 (집/회사 등)" htmlFor="ad-label">
                <input id="ad-label" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
              </TextField>
              <TextField label="받는 사람" htmlFor="ad-name">
                <input id="ad-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
              </TextField>
            </div>
            <TextField label="연락처" htmlFor="ad-phone">
              <input id="ad-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
            </TextField>
            <TextField label="주소" htmlFor="ad-addr">
              <input id="ad-addr" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
            </TextField>
            <label className="flex items-center gap-2 text-sm cursor-pointer pt-2">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-ink" />
              기본 배송지로 설정
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className="bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40">
                {busy ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-divider px-5 py-2.5 text-sm text-ink/60 hover:text-ink transition">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {!ready ? (
        <p className="text-center text-ink/40 py-10">불러오는 중...</p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gold/30">
          <MapPin className="w-8 h-8 text-ink/15 mx-auto mb-3" />
          <p className="text-sm text-ink/50">저장된 주소가 없어요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="bg-card border border-gold/30 p-5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs tracking-shop uppercase bg-beige px-2 py-0.5 border border-gold/30">{a.label}</span>
                  {a.isDefault && (
                    <span className="text-[10px] tracking-shop uppercase bg-gold/15 text-gold-dark px-2 py-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> 기본
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{a.name} · {a.phone}</p>
                <p className="text-xs text-ink/60 mt-0.5">{a.address}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a.id)} className="text-[11px] text-ink/60 hover:text-gold transition">기본 설정</button>
                )}
                <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
