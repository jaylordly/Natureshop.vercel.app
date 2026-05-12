"use client";
import { ReactNode } from "react";

export function TextField({
  label,
  htmlFor,
  hint,
  trailing,
  className = "",
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      {label && (
        <span className="block text-[11px] tracking-cta uppercase text-ink/60 mb-2">{label}</span>
      )}
      <span className="flex items-center border border-gold/40 bg-card focus-within:ring-1 focus-within:ring-gold focus-within:border-gold transition">
        <span className="flex-1">{children}</span>
        {trailing && <span className="pr-3">{trailing}</span>}
      </span>
      {hint && <span className="block text-[11px] text-ink/50 mt-1.5">{hint}</span>}
    </label>
  );
}
