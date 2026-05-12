import { Megaphone, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { listActiveNotices, type NoticeType } from '@/lib/notices';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '공지사항',
  alternates: { canonical: '/notices' },
};

const ICON: Record<NoticeType, React.ElementType> = {
  info: Info,
  event: Sparkles,
  warning: AlertTriangle,
};

const COLOR: Record<NoticeType, string> = {
  info: 'text-gold-dark',
  event: 'text-ink',
  warning: 'text-wine-dark',
};

function fmt(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default async function NoticesPage() {
  const notices = await listActiveNotices();

  return (
    <section className="container-narrow py-16 max-w-3xl">
      <div className="mb-10 text-center">
        <div className="inline-flex w-12 h-12 bg-gold/15 text-gold rounded-full items-center justify-center mb-4">
          <Megaphone className="w-6 h-6" />
        </div>
        <p className="text-[11px] tracking-cta uppercase text-gold mb-1">Notices</p>
        <h1 className="font-serif text-4xl">공지사항</h1>
      </div>

      {notices.length === 0 ? (
        <p className="text-center text-ink/50 py-20">현재 진행 중인 공지가 없어요.</p>
      ) : (
        <ul className="space-y-4">
          {notices.map((n) => {
            const Icon = ICON[n.type];
            return (
              <li key={n.id} className="bg-card border border-gold/30 p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${COLOR[n.type]} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-serif text-lg">{n.title}</h2>
                      {n.pinned && (
                        <span className="text-[9px] tracking-shop uppercase bg-gold text-beige px-1.5 py-0.5">Pinned</span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50">{fmt(n.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{n.content}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
