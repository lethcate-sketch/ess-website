"use client";

// UTC で保存された日時をクライアントのローカルに変換して表示する（§3-7）。
// サーバ/クライアントの TZ 差によるハイドレーション差分は suppressHydrationWarning で許容。
import { cn } from "@/lib/utils";

export function DateTime({
  value,
  className,
  dateOnly = false,
}: {
  value: string; // ISO8601
  className?: string;
  dateOnly?: boolean;
}) {
  const d = new Date(value);
  const text = dateOnly
    ? d.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "short",
      })
    : d.toLocaleString("ja-JP", {
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <time dateTime={value} suppressHydrationWarning className={cn(className)}>
      {text}
    </time>
  );
}
