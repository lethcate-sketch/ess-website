import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * 汎用カード。大きめの角丸 + やわらかい影 + 淡い枠。
 * 背景に淡い青/ミントを敷きたい場合は className で bg-* を上書きする。
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line/70 bg-white p-6 shadow-card",
        className,
      )}
      {...props}
    />
  );
}
