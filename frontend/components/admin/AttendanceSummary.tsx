"use client";

import { useMemo, useState } from "react";

import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type AttendanceRow = {
  id: string;
  name: string;
  status: string;
  comment: string | null;
};

const STATUS_ORDER = ["ATTENDING", "LATE", "UNDECIDED", "ABSENT"];
const REASON_STATUSES = new Set(["LATE", "ABSENT"]); // 理由（comment）を表示するステータス

/** 出欠集計。件数表示＋ステータスでの絞り込み（一覧を絞る）。 */
export function AttendanceSummary({ attendances }: { attendances: AttendanceRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(STATUS_ORDER));

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of attendances) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [attendances]);

  const filtered = useMemo(
    () => attendances.filter((a) => selected.has(a.status)),
    [attendances, selected],
  );

  function toggle(s: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {STATUS_ORDER.map((k) => (
          <div key={k} className="bg-surface p-4 text-center">
            <p className="font-mono text-2xl font-semibold">{counts[k] ?? 0}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              {ATTENDANCE_STATUS_LABEL[k]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_ORDER.map((s) => {
          const on = selected.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={on}
              className={cn(
                "border px-3 py-1.5 font-mono text-xs transition-colors",
                on
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line text-ink-muted hover:border-ink",
              )}
            >
              {ATTENDANCE_STATUS_LABEL[s]}（{counts[s] ?? 0}）
            </button>
          );
        })}
        <span className="ml-2 font-mono text-xs text-ink-subtle">
          表示: {filtered.length} / {attendances.length} 名
        </span>
      </div>

      {filtered.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line text-sm">
          {filtered.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-2">
              <span className="text-ink">{a.name}</span>
              <span className="text-right font-mono text-xs text-ink-muted">
                {ATTENDANCE_STATUS_LABEL[a.status] ?? a.status}
                {REASON_STATUSES.has(a.status) && a.comment ? ` ・ ${a.comment}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">該当する出欠がありません。</p>
      )}
    </div>
  );
}
