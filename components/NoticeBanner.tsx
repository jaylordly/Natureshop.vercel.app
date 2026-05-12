'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, X, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { getPinnedNotice, type Notice, type NoticeType } from '@/lib/notices';

const ICON: Record<NoticeType, React.ElementType> = {
  info: Info,
  event: Sparkles,
  warning: AlertTriangle,
};

const STYLE: Record<NoticeType, string> = {
  info: 'bg-gold/15 text-ink border-gold/40',
  event: 'bg-ink text-beige border-ink',
  warning: 'bg-wine-dark/10 text-wine-dark border-wine-dark/40',
};

const DISMISS_KEY = 'tna.notice-dismissed.v1';

export default function NoticeBanner() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    (async () => {
      const n = await getPinnedNotice();
      if (!n) return;
      try {
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed === n.id) {
          setHidden(true);
          return;
        }
      } catch {}
      setNotice(n);
    })();
  }, []);

  if (!notice || hidden) return null;

  const Icon = ICON[notice.type];

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, notice.id);
    } catch {}
  };

  return (
    <div className={`border-b ${STYLE[notice.type]}`}>
      <div className="container-narrow flex items-center justify-between gap-3 py-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon className="w-4 h-4 shrink-0" />
          <Link href="/notices" className="min-w-0 hover:underline">
            <span className="font-medium truncate">{notice.title}</span>
            <span className="hidden sm:inline opacity-70"> · {notice.content.slice(0, 60)}{notice.content.length > 60 && '...'}</span>
          </Link>
        </div>
        <button onClick={dismiss} aria-label="닫기" className="opacity-60 hover:opacity-100 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export { Megaphone };
