'use client';
import { useEffect, useState } from 'react';
import { Plus, Power, Trash2, GraduationCap } from 'lucide-react';
import {
  listStudentCodes,
  createStudentCode,
  toggleStudentCode,
  deleteStudentCode,
  type StudentCode,
} from '@/lib/student-codes';
import { TextField } from '@/components/TextField';

function fmtDate(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminStudentCodesPage() {
  const [codes, setCodes] = useState<StudentCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const refresh = async () => {
    const list = await listStudentCodes();
    setCodes(list);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!newCode.trim()) return;
    setBusy(true);
    const { ok, error } = await createStudentCode({
      code: newCode.trim().toUpperCase(),
      label: newLabel.trim() || undefined,
      maxUses: newMaxUses ? Number(newMaxUses) : null,
    });
    setBusy(false);
    if (!ok) {
      setErr(error || '추가 실패');
      return;
    }
    setNewCode('');
    setNewLabel('');
    setNewMaxUses('');
    void refresh();
  };

  const handleToggle = async (c: StudentCode) => {
    await toggleStudentCode(c.code, !c.active);
    void refresh();
  };

  const handleDelete = async (c: StudentCode) => {
    if (!confirm(`코드 "${c.code}"를 삭제하시겠어요?`)) return;
    await deleteStudentCode(c.code);
    void refresh();
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8">
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Student Codes</p>
        <h1 className="font-serif text-3xl">수강생 코드 관리</h1>
        <p className="text-ink/60 text-sm mt-2">코드를 발급/회수해서 수강생 승급을 관리합니다.</p>
      </div>

      {/* 새 코드 추가 */}
      <div className="bg-card border border-gold/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-lg">새 코드 추가</h2>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <TextField label="코드 (영문/숫자)" htmlFor="sc-code">
            <input
              id="sc-code"
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="STUDENT2027"
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none font-mono"
            />
          </TextField>
          <TextField label="메모 (선택)" htmlFor="sc-label">
            <input
              id="sc-label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="2027 봄학기"
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
            />
          </TextField>
          <TextField label="최대 사용 횟수 (비우면 무제한)" htmlFor="sc-max">
            <input
              id="sc-max"
              type="number"
              min={1}
              value={newMaxUses}
              onChange={(e) => setNewMaxUses(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
            />
          </TextField>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 bg-ink text-beige px-5 py-3 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> 추가
          </button>
        </form>
        {err && <p className="text-red-600 text-xs mt-3">{err}</p>}
      </div>

      {/* 코드 목록 */}
      <div className="bg-card border border-gold/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-3 sm:px-5 py-3">코드</th>
                <th className="text-left px-3 sm:px-5 py-3 hidden sm:table-cell">메모</th>
                <th className="text-left px-3 sm:px-5 py-3">상태</th>
                <th className="text-right px-3 sm:px-5 py-3">사용</th>
                <th className="text-right px-3 sm:px-5 py-3 hidden md:table-cell">생성일</th>
                <th className="text-right px-3 sm:px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-ink/40">불러오는 중...</td></tr>
              ) : codes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-ink/40">발급된 코드가 없습니다.</td></tr>
              ) : (
                codes.map((c) => (
                  <tr key={c.code} className="border-t border-gold/15">
                    <td className="px-3 sm:px-5 py-3 font-mono">
                      <GraduationCap className="w-3.5 h-3.5 text-gold inline mr-1" />
                      {c.code}
                    </td>
                    <td className="px-3 sm:px-5 py-3 hidden sm:table-cell text-ink/70">{c.label || '—'}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] tracking-shop uppercase ${
                        c.active ? 'bg-gold/15 text-gold-dark' : 'bg-ink/5 text-ink/50'
                      }`}>
                        {c.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right">
                      {c.usedCount}
                      {c.maxUses != null && <span className="text-ink/40"> / {c.maxUses}</span>}
                    </td>
                    <td className="px-3 sm:px-5 py-3 text-right text-xs text-ink/50 hidden md:table-cell">{fmtDate(c.createdAt)}</td>
                    <td className="px-3 sm:px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(c)}
                        className="inline-flex items-center gap-1 text-xs text-ink/70 hover:text-gold transition mr-3"
                        title={c.active ? '비활성화' : '활성화'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
