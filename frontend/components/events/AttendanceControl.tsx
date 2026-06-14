"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const OPTIONS = ["ATTENDING", "LATE", "UNDECIDED", "ABSENT"];

export function AttendanceControl({
  eventId,
  initialStatus,
}: {
  eventId: string;
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setAttendance(next: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error?.message ?? "更新に失敗しました。");
        return;
      }
      setStatus(next);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={loading}
          onClick={() => setAttendance(opt)}
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
  );
}
