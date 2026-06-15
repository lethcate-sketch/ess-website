import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * セクション見出し。タイトル横に小さなアイコンチップを置いてアクセントにする。
 * tone でチップの色味（ブルー / ミント）を切り替える。
 */
type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  eyebrow?: string;
  tone?: "brand" | "mint";
  className?: string;
  action?: ReactNode;
};

const CHIP = {
  brand: "bg-brand-50 text-brand-600 ring-1 ring-brand-100",
  mint: "bg-mint-50 text-mint-400 ring-1 ring-mint-100",
};

export function SectionTitle({
  icon: Icon,
  title,
  eyebrow,
  tone = "brand",
  className,
  action,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              CHIP[tone],
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-navy">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}
