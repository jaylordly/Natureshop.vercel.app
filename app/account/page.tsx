'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Save, Lock, Package, LogOut, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { listOrdersFromDb, type DbOrder } from '@/lib/orders';
import { STATUS_LABEL, STATUS_BADGE } from '@/lib/status-style';
import { TextField } from '@/components/TextField';

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const ROLE_LABEL: Record<string, string> = {
  user: '일반 회원',
  student: '수강생',
  admin: '관리자',
};

export default function AccountPage() {
  const { user, loading, updateName, updatePassword, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [name, setName] = useState('');
  const [nameMsg, setNameMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // 로그인 안 된 경우 로그인 페이지로
  useEffect(() => {
    if (!loading && (!user || user.id.startsWith('demo-'))) {
      router.push('/login?redirect=/account');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && !user.id.startsWith('demo-')) {
      setName(user.name);
      (async () => {
        const all = await listOrdersFromDb();
        setOrders(all);
        setOrdersLoading(false);
      })();
    }
  }, [user]);

  if (loading || !user || user.id.startsWith('demo-')) {
    return <section className="container-narrow py-24 text-center text-ink/40">불러오는 중...</section>;
  }

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) {
      setNameMsg({ kind: 'err', text: '이름을 입력하세요.' });
      return;
    }
    setNameBusy(true);
    const { ok, error } = await updateName(name.trim());
    setNameBusy(false);
    if (!ok) {
      setNameMsg({ kind: 'err', text: error || '저장 실패' });
      return;
    }
    setNameMsg({ kind: 'ok', text: '이름을 변경했습니다.' });
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ kind: 'err', text: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }
    if (newPw !== newPw2) {
      setPwMsg({ kind: 'err', text: '비밀번호 확인이 일치하지 않습니다.' });
      return;
    }
    setPwBusy(true);
    const { ok, error } = await updatePassword(newPw);
    setPwBusy(false);
    if (!ok) {
      setPwMsg({ kind: 'err', text: error || '변경 실패' });
      return;
    }
    setNewPw('');
    setNewPw2('');
    setPwMsg({ kind: 'ok', text: '비밀번호가 변경되었습니다.' });
  };

  return (
    <section className="container-narrow py-12 max-w-3xl">
      <div className="mb-10">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">My Account</p>
        <h1 className="font-serif text-3xl sm:text-4xl">{user.name}님</h1>
        <p className="text-ink/60 text-sm mt-2">
          <span className="inline-block bg-gold/15 text-gold-dark px-2 py-0.5 text-[10px] tracking-shop uppercase mr-2">
            {ROLE_LABEL[user.role] || user.role}
          </span>
        </p>
      </div>

      {/* 빠른 진입 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/account/wishlist" className="bg-card border border-gold/30 p-4 hover:border-gold transition flex items-center gap-3">
          <Heart className="w-5 h-5 text-wine-dark fill-wine-dark/20" />
          <div>
            <p className="text-sm">찜한 상품</p>
            <p className="text-[11px] text-ink/50">찜 목록 보기</p>
          </div>
        </Link>
        <Link href="/account/addresses" className="bg-card border border-gold/30 p-4 hover:border-gold transition flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gold" />
          <div>
            <p className="text-sm">배송지 관리</p>
            <p className="text-[11px] text-ink/50">주소록 추가/삭제</p>
          </div>
        </Link>
      </div>

      {/* 프로필 */}
      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-lg">프로필</h2>
        </div>
        <form onSubmit={handleNameSave} className="space-y-3">
          <TextField label="이름" htmlFor="acc-name">
            <input
              id="acc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
            />
          </TextField>
          {nameMsg && (
            <p className={`text-xs ${nameMsg.kind === 'ok' ? 'text-gold-dark' : 'text-red-600'}`}>{nameMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={nameBusy || name === user.name}
            className="flex items-center gap-2 bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> {nameBusy ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-lg">비밀번호 변경</h2>
        </div>
        <form onSubmit={handlePwChange} className="space-y-3">
          <TextField label="새 비밀번호 (6자 이상)" htmlFor="acc-pw">
            <input
              id="acc-pw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
              autoComplete="new-password"
            />
          </TextField>
          <TextField label="새 비밀번호 확인" htmlFor="acc-pw2">
            <input
              id="acc-pw2"
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
              autoComplete="new-password"
            />
          </TextField>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.kind === 'ok' ? 'text-gold-dark' : 'text-red-600'}`}>{pwMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={pwBusy || !newPw}
            className="flex items-center gap-2 bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40"
          >
            <Lock className="w-4 h-4" /> {pwBusy ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>

      {/* 주문 내역 */}
      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-lg">주문 내역</h2>
          <span className="ml-auto text-xs text-ink/50">{ordersLoading ? '' : `${orders.length}건`}</span>
        </div>
        {ordersLoading ? (
          <p className="text-sm text-ink/40 py-8 text-center">불러오는 중...</p>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink/50 mb-4">아직 주문 내역이 없어요</p>
            <Link href="/products" className="inline-block bg-ink text-beige px-5 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition">
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gold/15">
            {orders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/orders/${o.id}`} className="text-sm hover:text-gold transition truncate block">
                    {o.items[0]?.productName ?? '주문 항목 없음'}
                    {o.items.length > 1 && <span className="text-ink/50"> 외 {o.items.length - 1}건</span>}
                  </Link>
                  <p className="text-[11px] text-ink/40 font-mono mt-0.5">{o.id} · {fmt(o.createdAt)}</p>
                </div>
                <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase whitespace-nowrap ${STATUS_BADGE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <p className="text-sm whitespace-nowrap">₩{o.total.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 로그아웃 */}
      <div className="text-center">
        <button
          onClick={async () => { await logout(); router.push('/'); }}
          className="inline-flex items-center gap-2 border border-gold/40 px-6 py-3 text-sm tracking-shop hover:bg-ink hover:text-beige transition"
        >
          <LogOut className="w-4 h-4" /> 로그아웃
        </button>
      </div>
    </section>
  );
}
