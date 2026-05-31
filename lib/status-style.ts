export type OrderStatus =
  | "paid" | "pending" | "preparing" | "shipped" | "delivered"
  | "failed" | "demo" | "refunding" | "refunded";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "결제 완료",
  pending: "입금 대기",
  preparing: "배송 준비 중",
  shipped: "배송 중",
  delivered: "배송 완료",
  failed: "결제 실패",
  demo: "데모",
  refunding: "환불 처리 중",
  refunded: "환불됨",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  paid:    "bg-gold/15 text-gold-dark border border-gold/30",
  pending: "bg-cream text-espresso border border-divider",
  preparing: "bg-gold/10 text-gold-dark border border-gold/25",
  shipped: "bg-gold/15 text-gold-dark border border-gold/30",
  delivered: "bg-gold/20 text-gold-dark border border-gold/40",
  failed:  "bg-wine-dark/10 text-wine-dark border border-wine-dark/30",
  demo:    "bg-ink/5 text-ink/60 border border-ink/15",
  refunding: "bg-cream text-espresso border border-divider",
  refunded: "bg-ink/8 text-ink/70 border border-ink/20 line-through decoration-ink/40",
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  paid:    "bg-gold-dark",
  pending: "bg-espresso",
  preparing: "bg-gold",
  shipped: "bg-gold-dark",
  delivered: "bg-gold-dark",
  failed:  "bg-wine-dark",
  demo:    "bg-ink/40",
  refunding: "bg-espresso",
  refunded: "bg-ink/50",
};
