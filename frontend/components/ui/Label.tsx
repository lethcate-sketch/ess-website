import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1 block font-mono text-xs uppercase tracking-wide text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}
