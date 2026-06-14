import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-accent",
        className,
      )}
      {...props}
    />
  );
});
