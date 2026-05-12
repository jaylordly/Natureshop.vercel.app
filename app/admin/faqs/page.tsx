'use client';
import { useEffect, useState } from 'react';
import { Plus, Power, Trash2, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { listAllFaqs, createFaq, updateFaq, deleteFaq, type Faq, type FaqCategory } from '@/lib/faqs';
import { useToast } from '@/components/Toast';
import { TextField } from '@/components/TextField';

const CATEGORY_LABEL: Record<FaqCategory, string> = {
  general: '일반', order: '주문', payment: '결제', shipping: '배송', product: '상품',
};

export default function AdminFaqsPage() {
  const { show } = useToast();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ question: string; answer: string; category: FaqCategory; sortOrder: string }>({
    question: '', answer: '', category: 'general', sortOrder: '0',
  });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setFaqs(await listAllFaqs());
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setBusy(true);
    const { ok, error } = await createFaq({
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      sortOrder: Number(form.sortOrder) || 0,
    });
    setBusy(false);
    if (!ok) { show(`등록 실패: ${error}`, 'error'); return; }
    show('FAQ 등록됨', 'success');
    setForm({ question: '', answer: '', category: 'general', sortOrder: '0' });
    setShowForm(false);
    void refresh();
  };

  const toggleActive = async (f: Faq) => {
    await updateFaq(f.id, { active: !f.active });
    void refresh();
  };

  const move = async (f: Faq, delta: number) => {
    await updateFaq(f.id, { sortOrder: f.sortOrder + delta });
    void refresh();
  };

  const handleDelete = async (f: Faq) => {
    if (!confirm(`"${f.question}"을(를) 삭제하시겠어요?`)) return;
    await deleteFaq(f.id);
    show('삭제됨', 'info');
    void refresh();
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8 flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">FAQ</p>
          <h1 className="font-serif text-3xl">자주 묻는 질문 관리</h1>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition">
            <Plus className="w-4 h-4" /> 새 FAQ
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-gold/30 p-6 mb-6">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="카테고리" htmlFor="fq-cat">
                <select id="fq-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FaqCategory })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none">
                  {(Object.keys(CATEGORY_LABEL) as FaqCategory[]).map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </TextField>
              <TextField label="정렬 순서 (낮을수록 위)" htmlFor="fq-order">
                <input id="fq-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
              </TextField>
            </div>
            <TextField label="질문" htmlFor="fq-q">
              <input id="fq-q" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none" />
            </TextField>
            <TextField label="답변" htmlFor="fq-a">
              <textarea id="fq-a" required rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none resize-none" />
            </TextField>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="bg-ink text-beige px-5 py-2.5 text-sm tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40">{busy ? '등록 중...' : '등록'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-divider px-5 py-2.5 text-sm text-ink/60 hover:text-ink transition">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-gold/30">
        {loading ? (
          <p className="text-center py-12 text-ink/40">불러오는 중...</p>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-7 h-7 text-ink/15 mx-auto mb-3" />
            <p className="text-sm text-ink/50">아직 FAQ가 없어요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gold/15">
            {faqs.map((f) => (
              <li key={f.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] tracking-shop uppercase bg-beige border border-gold/30 px-1.5 py-0.5">{CATEGORY_LABEL[f.category]}</span>
                    <span className="text-[10px] text-ink/40">정렬: {f.sortOrder}</span>
                    {!f.active && <span className="text-[10px] bg-ink/10 text-ink/50 px-1.5 py-0.5">비활성</span>}
                  </div>
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="text-xs text-ink/60 mt-1 line-clamp-2 whitespace-pre-line">{f.answer}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex">
                    <button onClick={() => move(f, -1)} title="위로" className="p-1 text-ink/60 hover:text-gold transition"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => move(f, 1)} title="아래로" className="p-1 text-ink/60 hover:text-gold transition"><ArrowDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <button onClick={() => toggleActive(f)} title={f.active ? '비활성화' : '활성화'} className="p-1 text-ink/60 hover:text-gold transition"><Power className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(f)} title="삭제" className="p-1 text-red-500 hover:text-red-700 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
