"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const OPTIONS = ["ATTENDING", "LATE", "UNDECIDED", "ABSENT"];

export function AttendanceControl({
  eventId,
  initialStatus,
  initialComment,
}: {
  eventId: string;
  initialStatus?: string | null;
  initialComment?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [comment, setComment] = useState(initialComment ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // status と comment（遅刻理由）を送信する。遅刻以外では理由を消す。
  async function submit(nextStatus: string, nextComment: string | null) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus, comment: nextComment }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error?.message ?? "更新に失敗しました。");
        return false;
      }
      setStatus(nextStatus);
      router.refresh();
      return true;
    } catch {
      setError("通信エラーが発生しました。");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function chooseStatus(next: string) {
    const ok = await submit(next, next === "LATE" ? comment.trim() || null : null);
    if (ok && next !== "LATE") setComment("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={loading}
            onClick={() => chooseStatus(opt)}
            className={cn(
              "border px-3 py-1 font-mono text-xs transition-colors disabled:opacity-50",
              status === opt
                ? "border-accent bg-accent text-accent-fg"
                : "border-line text-ink-muted hover:border-ink",
            )}
          >
            {ATTENDANCE_STATUS_LABEL[opt]}
          </button>
        ))}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {status === "LATE" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder="遅刻理由（任意）"
            className="min-w-0 flex-1 border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-accent"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => submit("LATE", comment.trim() || null)}
            className="border border-accent px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent-subtle disabled:opacity-50"
          >
            理由を保存
          </button>
        </div>
      )}
    </div>
  );
}
