export type OrderStatus = "paid" | "pending" | "failed" | "demo" | "refunded";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "결제 완료",
  pending: "결제 대기",
  failed: "결제 실패",
  demo: "데모",
  refunded: "환불됨",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  paid:    "bg-gold/15 text-gold-dark border border-gold/30",
  pending: "bg-cream text-espresso border border-divider",
  failed:  "bg-wine-dark/10 text-wine-dark border border-wine-dark/30",
  demo:    "bg-ink/5 text-ink/60 border border-ink/15",
  refunded: "bg-ink/8 text-ink/70 border border-ink/20 line-through decoration-ink/40",
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  paid:    "bg-gold-dark",
  pending: "bg-espresso",
  failed:  "bg-wine-dark",
  demo:    "bg-ink/40",
  refunded: "bg-ink/50",
};
