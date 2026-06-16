import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * 当月・翌月のカレンダー。公開イベントを開始日に配置し、タイトルをクリックで詳細へ。
 *
 * 日付は日本時間(JST)で確定的にサーバ描画する（クライアントTZ依存にしないことで
 * ハイドレーション差分を避ける）。対象読者が国内のため JST 固定で扱う。
 */
type CalEvent = { id: string; title: string; startAt: Date };

const TZ = "Asia/Tokyo";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Date を JST の "YYYY-MM-DD" に変換。 */
function jstKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** JST 基準の年・月・日。 */
function jstParts(d: Date): { year: number; month: number; day: number } {
  const [year, month, day] = jstKey(d).split("-").map(Number);
  return { year, month, day };
}

type Cell = { day: number; key: string } | null;

/** 指定年月(1-12)の日セル配列。先頭は曜日合わせの空セル。UTC基準で暦計算しTZ非依存にする。 */
function buildMonth(year: number, month: number): Cell[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=日
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Cell[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${year}-${pad(month)}-${pad(d)}` });
  }
  return cells;
}

export function EventCalendar({ events, now }: { events: CalEvent[]; now: Date }) {
  const today = jstParts(now);
  const todayKey = `${today.year}-${pad(today.month)}-${pad(today.day)}`;

  // 当月と翌月
  const months =
    today.month === 12
      ? [
          { year: today.year, month: 12 },
          { year: today.year + 1, month: 1 },
        ]
      : [
          { year: today.year, month: today.month },
          { year: today.year, month: today.month + 1 },
        ];

  // 開始日(JST)ごとにイベントをまとめる（時刻順）
  const byDay = new Map<string, CalEvent[]>();
  const sorted = [...events].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
  for (const e of sorted) {
    const k = jstKey(e.startAt);
    const arr = byDay.get(k);
    if (arr) arr.push(e);
    else byDay.set(k, [e]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {months.map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          byDay={byDay}
          todayKey={todayKey}
        />
      ))}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  byDay,
  todayKey,
}: {
  year: number;
  month: number;
  byDay: Map<string, CalEvent[]>;
  todayKey: string;
}) {
  return (
    <div className="rounded-3xl border border-line/70 bg-white p-4 shadow-card sm:p-5">
      <h3 className="px-1 font-display text-lg font-bold text-navy">
        {year}年{month}月
      </h3>

      <div className="mt-4 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "pb-2 text-center font-display text-xs font-semibold",
              i === 0 ? "text-danger" : i === 6 ? "text-brand-600" : "text-ink-subtle",
            )}
          >
            {w}
          </div>
        ))}

        {buildMonth(year, month).map((cell, idx) => {
          if (!cell) return <div key={`b-${idx}`} className="min-h-[4.5rem]" />;
          const dayEvents = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          return (
            <div
              key={cell.key}
              className="min-h-[4.5rem] border-t border-line/50 px-0.5 pt-1"
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  isToday ? "bg-brand-gradient text-white shadow-soft" : "text-ink-muted",
                )}
              >
                {cell.day}
              </span>
              {dayEvents.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {dayEvents.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/events/${e.id}`}
                        title={e.title}
                        className="block truncate rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium leading-tight text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        {e.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
