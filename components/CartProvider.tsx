'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

const KEY = 'tna.cart.v1';

interface CartContextValue {
  items: CartItem[];
  add: (productId: string, quantity?: number) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLocal(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

function mergeItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const it of a) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  for (const it of b) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  return Array.from(map, ([productId, quantity]) => ({ productId, quantity }));
}

async function fetchDbCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
}

async function writeDbCart(userId: string, items: CartItem[]) {
  // 단순화: 기존 카트 비우고 새로 삽입 (행 수 작음 → 단순/안전)
  await supabase.from('cart_items').delete().eq('user_id', userId);
  if (items.length === 0) return;
  await supabase.from('cart_items').insert(
    items.map((it) => ({ user_id: userId, product_id: it.productId, quantity: it.quantity })),
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 어떤 user.id로 마지막 sync했는지 추적 — 같은 user 안에선 DB 다시 안 부름
  const syncedFor = useRef<string | null>(null);

  // 1) 최초 마운트: localStorage에서 즉시 복원 (깜빡임 방지)
  useEffect(() => {
    setItems(readLocal());
    setHydrated(true);
  }, []);

  // 2) 로그인/로그아웃 시 동기화
  useEffect(() => {
    if (!hydrated) return;
    if (!isSupabaseConfigured) return;
    if (!user || user.id.startsWith('demo-')) {
      // 데모/비로그인: localStorage만 사용
      syncedFor.current = null;
      return;
    }
    if (syncedFor.current === user.id) return; // 같은 유저면 스킵

    (async () => {
      const dbItems = await fetchDbCart(user.id);
      const localItems = readLocal();
      // 로컬에 뭔가 있으면 DB와 머지 후 양쪽 갱신
      if (localItems.length > 0) {
        const merged = mergeItems(dbItems, localItems);
        await writeDbCart(user.id, merged);
        setItems(merged);
        writeLocal(merged);
      } else {
        setItems(dbItems);
        writeLocal(dbItems);
      }
      syncedFor.current = user.id;
    })();
  }, [user, hydrated]);

  // 3) items 바뀌면 localStorage 항상 저장 + 로그인 상태면 DB도 저장 (debounce)
  useEffect(() => {
    if (!hydrated) return;
    writeLocal(items);
    if (!isSupabaseConfigured) return;
    if (!user || user.id.startsWith('demo-')) return;
    if (syncedFor.current !== user.id) return; // 초기 sync 끝나기 전엔 DB 쓰지 않음

    const t = setTimeout(() => {
      void writeDbCart(user.id, items);
    }, 400);
    return () => clearTimeout(t);
  }, [items, hydrated, user]);

  const add = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.productId === productId);
      if (i === -1) return [...prev, { productId, quantity }];
      const next = prev.slice();
      next[i] = { ...next[i], quantity: next[i].quantity + quantity };
      return next;
    });
  }, []);

  const update = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((p) => p.productId !== productId);
      return prev.map((p) => (p.productId === productId ? { ...p, quantity } : p));
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
