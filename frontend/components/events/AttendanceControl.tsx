"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const OPTIONS = ["ATTENDING", "LATE", "UNDECIDED", "ABSENT"];
// 理由（comment）を入力できるステータス
const REASON_STATUSES = new Set(["LATE", "ABSENT"]);

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
  // 直近にサーバへ保存した理由。これと現在の入力が一致していれば「保存済み」。
  const [savedComment, setSavedComment] = useState((initialComment ?? "").trim());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const reason = REASON_STATUSES.has(next) ? comment.trim() || null : null;
    const ok = await submit(next, reason);
    if (!ok) return;
    if (REASON_STATUSES.has(next)) {
      setSavedComment(comment.trim());
    } else {
      setComment("");
      setSavedComment("");
    }
  }

  async function saveReason() {
    if (!status) return;
    const ok = await submit(status, comment.trim() || null);
    if (ok) setSavedComment(comment.trim());
  }

  const showReason = status != null && REASON_STATUSES.has(status);
  const isSaved = comment.trim() !== "" && comment.trim() === savedComment;
  const reasonLabel = status === "ABSENT" ? "欠席理由" : "遅刻理由";

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

      {showReason && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`${reasonLabel}（任意）`}
            className="min-w-0 flex-1 border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-accent"
          />
          <button
            type="button"
            disabled={loading || isSaved}
            onClick={saveReason}
            className={cn(
              "border px-3 py-1.5 text-xs transition-colors disabled:opacity-60",
              isSaved
                ? "border-mint-200 bg-mint-50 text-navy"
                : "border-accent text-accent hover:bg-accent-subtle",
            )}
          >
            {isSaved ? "保存済み" : "理由を保存"}
          </button>
        </div>
      )}
    </div>
  );
}
