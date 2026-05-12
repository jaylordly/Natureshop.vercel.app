'use client';
import { useEffect, useState } from 'react';
import { Plus, Power, Trash2, Pin, Megaphone } from 'lucide-react';
import {
  listAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  type Notice,
  type NoticeType,
} from '@/lib/notices';
import { useToast } from '@/components/Toast';
import { TextField } from '@/components/TextField';

const TYPE_LABEL: Record<NoticeType, string> = {
  info: '안내',
  event: '이벤트',
  warning: '주의',
};

const TYPE_BADGE: Record<NoticeType, string> = {
  info: 'bg-gold/15 text-gold-dark',
  event: 'bg-ink text-beige',
  warning: 'bg-wine-dark/10 text-wine-dark',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminNoticesPage() {
  const { show } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; type: NoticeType; pinned: boolean; endsAt: string }>({
    title: '',
    content: '',
    type: 'info',
    pinned: false,
    endsAt: '',
  });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setNotices(await listAllNotices());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setBusy(true);
    const { ok, error } = await createNotice({
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      pinned: form.pinned,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    });
    setBusy(false);
    if (!ok) {
      show(`등록 실패: ${error}`, 'error');
      return;
    }
    show('공지 등록됨', 'success');
    setForm({ title: '', content: '', type: 'info', pinned: false, endsAt: '' });
    setShowForm(false);
    void refresh();
  };

  const toggleActive = async (n: Notice) => {
    await updateNotice(n.id, { active: !n.active });
    show(`${n.active ? '비활성화' : '활성화'} 됨`, 'info');
    void refresh();
  };

  const togglePinned = async (n: Notice) => {
    await updateNotice(n.id, { pinned: !n.pinned });
    show(`${n.pinned ? '고정 해제' : '상단 고정'}`, 'info');
    void refresh();
  };

  const handleDelete = async (n: Notice) => {
    if (!confirm(`"${n.title}" 공지를 삭제하시겠어요?`)) return;
    await deleteNotice(n.id);
    show('공지 삭제됨', 'info');
    void refresh();
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8 flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Notices</p>
          <h1 className="font-serif text-3xl">공지사항 관리</h1>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition">
            <Plus className="w-4 h-4" /> 새 공지
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-gold/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-lg">새 공지 작성</h2>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="유형" htmlFor="nt-type">
                <select id="nt-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NoticeType })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none">
                  <option value="info">안내</option>
                  <option value="event">이벤트</option>
                  <option value="warning">주의</option>
                </select>
              </TextField>
              <TextField label="종료일 (선택, 비우면 무기한)" htmlFor="nt-end">
                <input id="nt-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
              </TextField>
            </div>
            <TextField label="제목" htmlFor="nt-title">
              <input id="nt-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
            </TextField>
            <TextField label="내용" htmlFor="nt-content">
              <textarea id="nt-content" required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none resize-none" />
            </TextField>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-ink" />
              <Pin className="w-3.5 h-3.5 text-gold" /> 사이트 상단 배너로 고정
            </label>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={busy} className="bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40">
                {busy ? '등록 중...' : '등록'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-divider px-5 py-2.5 text-sm text-ink/60 hover:text-ink transition">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-gold/30">
        {loading ? (
          <p className="text-center py-12 text-ink/40">불러오는 중...</p>
        ) : notices.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-7 h-7 text-ink/15 mx-auto mb-3" />
            <p className="text-sm text-ink/50">아직 공지가 없어요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/15">
            {notices.map((n) => (
              <li key={n.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] tracking-shop uppercase px-1.5 py-0.5 ${TYPE_BADGE[n.type]}`}>
                      {TYPE_LABEL[n.type]}
                    </span>
                    {n.pinned && <span className="text-[10px] tracking-shop uppercase bg-gold text-beige px-1.5 py-0.5 inline-flex items-center gap-0.5"><Pin className="w-2.5 h-2.5" />고정</span>}
                    {!n.active && <span className="text-[10px] tracking-shop uppercase bg-ink/10 text-ink/50 px-1.5 py-0.5">비활성</span>}
                  </div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-ink/60 mt-1 line-clamp-2 whitespace-pre-line">{n.content}</p>
                  <p className="text-[11px] text-ink/40 mt-1">{fmt(n.createdAt)}{n.endsAt && ` · ${fmt(n.endsAt)}까지`}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button onClick={() => togglePinned(n)} title={n.pinned ? '고정 해제' : '상단 고정'} className={`p-1 transition ${n.pinned ? 'text-gold-dark' : 'text-ink/40 hover:text-gold'}`}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleActive(n)} title={n.active ? '비활성화' : '활성화'} className="p-1 text-ink/60 hover:text-gold transition">
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(n)} title="삭제" className="p-1 text-red-500 hover:text-red-700 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
