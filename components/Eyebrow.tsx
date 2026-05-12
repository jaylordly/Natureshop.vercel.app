type Tone = "shop" | "brow" | "dark";

const TONE_STYLES: Record<Tone, { text: string; rule: string }> = {
  shop: {
    text: "text-gold",
    rule: "bg-gold",
  },
  brow: {
    text: "text-[#A88080]",
    rule: "bg-[#A88080]",
  },
  dark: {
    text: "text-gold-soft",
    rule: "bg-gold-soft",
  },
};

export function Eyebrow({
  text,
  tone = "shop",
  align = "center",
  className = "",
}: {
  text: string;
  tone?: Tone;
  align?: "center" | "left";
  className?: string;
}) {
  const styles = TONE_STYLES[tone];
  const justify = align === "center" ? "justify-center" : "justify-start";
  return (
    <div className={`flex items-center gap-3 ${justify} ${className}`}>
      <span className={`h-px w-10 ${styles.rule}`} />
      <p className={`text-[11px] tracking-eyebrow uppercase ${styles.text}`}>{text}</p>
      <span className={`h-px w-10 ${styles.rule}`} />
    </div>
  );
}
