'use client';
import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/newsletter';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { ok, error } = await subscribeNewsletter(email.trim().toLowerCase());
    setBusy(false);
    if (!ok) {
      setErr(error || '구독에 실패했어요.');
      return;
    }
    setDone(true);
    setEmail('');
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-gold">
        <Check className="w-4 h-4" /> 구독해주셔서 감사합니다!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm">
      <div className="flex items-center gap-2 flex-1 border border-gold/30 px-3 py-2 bg-beige/50">
        <Mail className="w-3.5 h-3.5 text-ink/40 shrink-0" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={busy || !email}
        className="bg-ink text-beige px-4 py-2 text-xs tracking-shop hover:bg-gold hover:text-ink transition disabled:opacity-40 whitespace-nowrap"
      >
        {busy ? '구독 중...' : '구독하기'}
      </button>
      {err && <p className="text-red-600 text-xs">{err}</p>}
    </form>
  );
}
