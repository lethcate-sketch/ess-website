"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export function RegistrationToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ registrationEnabled: !enabled }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d?.error?.message ?? "更新に失敗しました。");
      }
    } catch {
      window.alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">新規登録の受付</p>
        <p className="mt-1 text-sm text-ink-muted">
          {enabled
            ? "受付中：ログイン画面に「新規登録」が表示され、登録できます。"
            : "停止中：新規登録は表示されず、登録もできません（部外者対策）。"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={cn(
          "shrink-0 border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
          enabled
            ? "border-accent bg-accent text-accent-fg hover:bg-accent-hover"
            : "border-line text-ink-muted hover:border-ink",
        )}
      >
        {loading ? "更新中..." : enabled ? "受付中 — クリックで停止" : "停止中 — クリックで受付"}
      </button>
    </div>
  );
}
