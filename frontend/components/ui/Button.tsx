import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "primary"
          ? "border-accent bg-accent text-accent-fg hover:bg-accent-hover"
          : "border-line bg-surface text-ink hover:border-ink",
        className,
      )}
      {...props}
    />
  );
}
