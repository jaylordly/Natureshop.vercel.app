'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Faq } from '@/lib/faqs';

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul className="space-y-2">
      {items.map((f) => {
        const open = openId === f.id;
        return (
          <li key={f.id} className="bg-card border border-gold/30">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : f.id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-beige/30 transition"
              aria-expanded={open}
            >
              <span className="text-sm font-medium">{f.question}</span>
              <ChevronDown className={`w-4 h-4 text-ink/50 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="px-5 pb-5 -mt-1 text-sm text-ink/70 leading-relaxed whitespace-pre-line border-t border-gold/15 pt-4">
                {f.answer}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
