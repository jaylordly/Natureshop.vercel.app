import type { CartItem } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
}

export type { OrderStatus } from './status-style';
import type { OrderStatus } from './status-style';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  shipping: ShippingInfo;
  createdAt: number;
  status: OrderStatus;
  paymentKey?: string;
  paymentMethod?: string;
  receiptUrl?: string;
}

const KEY = 'tna.orders.v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

function readAll(): Order[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: Order[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(orders));
}

export function newOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

interface CreateOrderInput {
  id?: string;
  items: CartItem[];
  total: number;
  shipping: ShippingInfo;
  status?: OrderStatus;
  paymentKey?: string;
  paymentMethod?: string;
  receiptUrl?: string;
}

export function createOrder(input: CreateOrderInput): Order {
  const order: Order = {
    id: input.id ?? newOrderId(),
    items: input.items,
    total: input.total,
    shipping: input.shipping,
    createdAt: Date.now(),
    status: input.status ?? 'demo',
    paymentKey: input.paymentKey,
    paymentMethod: input.paymentMethod,
    receiptUrl: input.receiptUrl,
  };
  const all = readAll();
  all.unshift(order);
  writeAll(all);
  return order;
}

export function getOrder(id: string): Order | undefined {
  return readAll().find((o) => o.id === id);
}

export function listOrders(): Order[] {
  return readAll();
}

/**
 * 결제 직전 사용자가 입력한 폼 정보를 임시 저장(Toss 결제창 redirect 사이의 상태 보존).
 * orderId 기준 sessionStorage에 저장 — 결제 성공/실패 후 불러와 최종 Order로 변환.
 */
const PENDING_PREFIX = 'tna.pending-order.';

export interface PendingOrder {
  orderId: string;
  items: CartItem[];
  total: number;
  shipping: ShippingInfo;
  createdAt: number;
  couponCode?: string;
  discount?: number;
}

export function setPendingOrder(p: PendingOrder) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_PREFIX + p.orderId, JSON.stringify(p));
}

export function getPendingOrder(orderId: string): PendingOrder | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PENDING_PREFIX + orderId);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder(orderId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_PREFIX + orderId);
}

// ─────────────────────────────────────────────
// Supabase 버전 (실 DB 연동)
// ─────────────────────────────────────────────

export interface OrderItemRich {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface DbOrder {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  shipping: ShippingInfo;
  paymentKey?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: number;
  items: OrderItemRich[];
  couponCode?: string;
  discountAmount: number;
}

interface CreateOrderInDbInput {
  id?: string;
  userId: string;
  items: { productId: string; quantity: number; priceAtPurchase: number }[];
  total: number;
  shipping: ShippingInfo;
  status?: OrderStatus;
  paymentKey?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  couponCode?: string;
  discount?: number;
}

export async function createOrderInDb(input: CreateOrderInDbInput): Promise<{ order: DbOrder | null; error: string | null }> {
  if (!isSupabaseConfigured) return { order: null, error: 'Supabase가 설정되지 않았습니다.' };

  const orderId = input.id ?? newOrderId();
  const status = input.status ?? 'demo';

  // place_order RPC: 재고 검증 + 차감 + 주문 + 라인 삽입을 원자적으로
  const { error } = await supabase.rpc('place_order', {
    p_order_id: orderId,
    p_total: input.total,
    p_status: status,
    p_shipping_name: input.shipping.name,
    p_shipping_phone: input.shipping.phone,
    p_shipping_address: input.shipping.address,
    p_payment_key: input.paymentKey ?? '',
    p_payment_method: input.paymentMethod ?? '',
    p_receipt_url: input.receiptUrl ?? '',
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      price_at_purchase: i.priceAtPurchase,
    })),
    p_coupon_code: input.couponCode ?? '',
    p_discount: input.discount ?? 0,
  });

  if (error) {
    console.error('[orders] place_order failed:', error);
    return { order: null, error: error.message };
  }

  const order = await getOrderFromDb(orderId);
  return { order, error: null };
}

export async function getOrderFromDb(id: string): Promise<DbOrder | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(product_id, quantity, price_at_purchase, products(name))')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return toDbOrder(data);
}

export async function listOrdersFromDb(): Promise<DbOrder[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(product_id, quantity, price_at_purchase, products(name))')
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('[orders] list failed:', error);
    return [];
  }
  return data.map(toDbOrder);
}

type RawOrderRow = {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_key: string | null;
  payment_method: string | null;
  receipt_url: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  created_at: string;
  order_items: {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    products: { name: string } | null;
  }[];
};

export async function updateOrderStatusInDb(
  id: string,
  status: OrderStatus,
): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

function toDbOrder(row: RawOrderRow): DbOrder {
  return {
    id: row.id,
    userId: row.user_id,
    total: row.total,
    status: row.status,
    shipping: {
      name: row.shipping_name,
      phone: row.shipping_phone,
      address: row.shipping_address,
    },
    paymentKey: row.payment_key ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    discountAmount: row.discount_amount ?? 0,
    createdAt: new Date(row.created_at).getTime(),
    items: row.order_items.map((i) => ({
      productId: i.product_id,
      productName: i.products?.name ?? i.product_id,
      quantity: i.quantity,
      priceAtPurchase: i.price_at_purchase,
    })),
  };
}
