/** className 結合の最小ヘルパー。 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * UTC で保存された日時をローカル表示に変換する（§3-7: 表示時にクライアントでローカル変換）。
 * value は ISO8601 文字列または Date。
 */
export function formatDateTime(
  value: string | Date,
  locale = "ja-JP",
): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value: string | Date, locale = "ja-JP"): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(locale, { dateStyle: "medium" });
}
