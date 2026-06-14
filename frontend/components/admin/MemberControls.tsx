"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MemberControls({
  userId,
  role,
  isActive,
}: {
  userId: string;
  role: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(path: string, body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/admin/members/${userId}/${path}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // ガード（自分自身/最後のADMIN）等で拒否された場合は理由を表示
        window.alert(d?.error?.message ?? "操作できませんでした。");
      }
    } catch {
      window.alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={loading}
        onChange={(e) => patch("role", { role: e.target.value })}
        className="border border-line bg-surface px-2 py-1 font-mono text-xs outline-none focus:border-accent disabled:opacity-50"
      >
        <option value="MEMBER">MEMBER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button
        type="button"
        disabled={loading}
        onClick={() => patch("status", { isActive: !isActive })}
        className="border border-line px-2 py-1 font-mono text-xs text-ink-muted hover:border-ink disabled:opacity-50"
      >
        {isActive ? "在籍中→無効化" : "無効→復帰"}
      </button>
    </div>
  );
}
