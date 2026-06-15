import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "brand" | "mint" | "muted";

// pill 型の淡い塗りバッジ（親しみのある配色）
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink ring-1 ring-line",
  accent: "bg-brand-50 text-brand-600 ring-1 ring-brand-100",
  brand: "bg-brand-50 text-brand-600 ring-1 ring-brand-100",
  mint: "bg-mint-50 text-mint-400 ring-1 ring-mint-100",
  muted: "bg-surface-muted text-ink-subtle ring-1 ring-line",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 font-display text-[11px] font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
