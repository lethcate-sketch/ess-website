import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "mint";
};

const VARIANTS = {
  // メインCTA: ブランドのグラデーション + 影、hover で拡大＆発光
  primary:
    "bg-brand-gradient text-white shadow-soft hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-glow",
  // セカンダリ: 白地 + ブランド枠、hover で淡いブルー
  secondary:
    "bg-white text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-soft",
  // ミント: 親しみのあるサブアクション
  mint:
    "bg-mint-gradient text-navy shadow-soft hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-card-hover",
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
