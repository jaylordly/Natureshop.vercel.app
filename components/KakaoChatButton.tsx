'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { CHAT_FLOW, type ChatNode } from '@/lib/chat-flow';
import Link from 'next/link';

const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || '';
const CHAT_API = process.env.NEXT_PUBLIC_KAKAO_CHAT_API || '';

interface Bubble {
  from: 'bot' | 'user';
  text: string;
  cta?: { label: string; href: string };
}

export default function KakaoChatButton() {
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [current, setCurrent] = useState<ChatNode | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (bubbles.length > 0) return;
    void start();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles]);

  async function start() {
    let node: ChatNode = CHAT_FLOW.start;
    if (CHAT_API) {
      try {
        const res = await fetch(`${CHAT_API}/start`);
        const data = await res.json();
        if (data?.node) node = data.node as ChatNode;
      } catch {}
    }
    setCurrent(node);
    setBubbles([{ from: 'bot', text: node.message, cta: node.cta }]);
  }

  async function pick(label: string, nextId: string) {
    setBubbles((b) => [...b, { from: 'user', text: label }]);
    let node: ChatNode | undefined = CHAT_FLOW[nextId];
    if (CHAT_API) {
      try {
        const res = await fetch(`${CHAT_API}/select`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ next: nextId }),
        });
        const data = await res.json();
        if (data?.node) node = data.node as ChatNode;
      } catch {}
    }
    if (!node) {
      setBubbles((b) => [...b, { from: 'bot', text: '죄송해요, 응답을 불러오지 못했어요.' }]);
      return;
    }
    setCurrent(node);
    setBubbles((b) => [...b, { from: 'bot', text: node!.message, cta: node!.cta }]);
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setBubbles((b) => [...b, { from: 'user', text }]);
    if (CHAT_API) {
      try {
        const res = await fetch(`${CHAT_API}/message`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data?.node) {
          setCurrent(data.node);
          setBubbles((b) => [...b, { from: 'bot', text: data.node.message, cta: data.node.cta }]);
          return;
        }
      } catch {}
    }
    setBubbles((b) => [
      ...b,
      {
        from: 'bot',
        text: '자세한 문의는 카카오톡 채널로 보내주시면 빠르게 답변드릴게요.',
        cta: KAKAO_URL ? { label: '카카오톡 채널', href: KAKAO_URL } : undefined,
      },
    ]);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="카카오톡 상담"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#FEE500] text-[#000000d8] shadow-lg flex items-center justify-center hover:scale-105 transition"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[340px] max-w-[calc(100vw-2.5rem)] h-[480px] bg-card border border-gold/30 shadow-2xl flex flex-col">
          <div className="px-4 py-3 border-b border-gold/30 flex items-center justify-between">
            <p className="font-serif text-base">상담 채팅</p>
            <button onClick={() => setOpen(false)} aria-label="닫기" className="text-ink/40 hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
            {bubbles.map((b, i) => (
              <div key={i} className={b.from === 'user' ? 'text-right' : ''}>
                <div
                  className={`inline-block px-3 py-2 max-w-[80%] ${
                    b.from === 'user'
                      ? 'bg-ink text-beige rounded-l-2xl rounded-tr-2xl'
                      : 'bg-beige border border-gold/30 rounded-r-2xl rounded-tl-2xl'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{b.text}</p>
                  {b.cta && (
                    <Link
                      href={b.cta.href}
                      target={b.cta.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs underline text-gold-dark"
                    >
                      {b.cta.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {current?.options && current.options.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {current.options.map((o) => (
                  <button
                    key={o.next}
                    onClick={() => pick(o.label, o.next)}
                    className="border border-gold/40 px-3 py-1.5 text-xs hover:bg-ink hover:text-beige transition"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="border-t border-gold/30 p-2 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1 border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:border-gold bg-cream"
            />
            <button type="submit" className="px-3 bg-ink text-beige hover:bg-gold hover:text-ink transition">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
