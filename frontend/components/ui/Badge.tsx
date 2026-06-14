import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "muted";

const TONES: Record<Tone, string> = {
  neutral: "border-line text-ink",
  accent: "border-accent text-accent",
  muted: "border-line text-ink-subtle",
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
        "inline-flex items-center border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
