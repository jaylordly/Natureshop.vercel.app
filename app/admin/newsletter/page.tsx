'use client';
import { useEffect, useState } from 'react';
import { Mail, Download } from 'lucide-react';
import { listSubscribers, type Subscriber } from '@/lib/newsletter';

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminNewsletterPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setSubs(await listSubscribers());
      setLoading(false);
    })();
  }, []);

  const exportCsv = () => {
    const header = ['email', 'subscribed_at'];
    const rows = subs.map((s) => [s.email, new Date(s.subscribedAt).toISOString()]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="container-narrow py-10">
      <div className="mb-8 flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Newsletter</p>
          <h1 className="font-serif text-3xl">뉴스레터 구독자</h1>
          <p className="text-ink/60 text-sm mt-2">{loading ? '' : `${subs.length}명 구독 중`}</p>
        </div>
        <button onClick={exportCsv} disabled={subs.length === 0} className="flex items-center gap-2 border border-gold/40 px-4 py-2.5 text-xs tracking-shop uppercase hover:bg-ink hover:text-beige transition disabled:opacity-40">
          <Download className="w-3.5 h-3.5" /> CSV 다운로드
        </button>
      </div>

      <div className="bg-card border border-gold/30">
        {loading ? (
          <p className="text-center py-12 text-ink/40">불러오는 중...</p>
        ) : subs.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-7 h-7 text-ink/15 mx-auto mb-3" />
            <p className="text-sm text-ink/50">아직 구독자가 없어요</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-beige/40 text-[11px] tracking-shop uppercase text-ink/50">
              <tr>
                <th className="text-left px-5 py-3">이메일</th>
                <th className="text-right px-5 py-3">구독일</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-gold/15">
                  <td className="px-5 py-3"><Mail className="w-3.5 h-3.5 text-ink/40 inline mr-2" />{s.email}</td>
                  <td className="px-5 py-3 text-right text-xs text-ink/50">{fmt(s.subscribedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
