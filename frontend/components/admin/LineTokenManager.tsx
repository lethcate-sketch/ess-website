"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { DateTime } from "@/components/ui/DateTime";
import { cn } from "@/lib/utils";

type TokenView = {
  id: string;
  code: string;
  userId: string | null;
  targetName: string | null;
  note: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
};

type MemberView = { id: string; name: string; linked: boolean };

export function LineTokenManager({
  tokens,
  members,
}: {
  tokens: TokenView[];
  members: MemberView[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function sharedFields() {
    const body: Record<string, unknown> = {};
    if (note.trim()) body.note = note.trim();
    const days = parseInt(expiryDays, 10);
    if (!Number.isNaN(days) && days > 0) body.expiresInDays = days;
    return body;
  }

  async function post(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/line/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d?.error?.message ?? "コードの発行に失敗しました。");
      }
    } catch {
      window.alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("この未使用コードを削除しますか？")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/admin/line/tokens/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d?.error?.message ?? "削除できませんでした。");
      }
    } catch {
      window.alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
      router.refresh();
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {
      window.alert("コピーできませんでした。コードを選択して手動でコピーしてください。");
    }
  }

  const inputClass =
    "border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50";
  const btnPrimary =
    "border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-50";
  const btnGhost =
    "border border-line px-4 py-2 text-sm hover:border-ink disabled:opacity-50";

  return (
    <div className="space-y-8">
      {/* ===== 発行パネル ===== */}
      <div className="border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold">コードを発行</h2>

        {/* 共通オプション */}
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              メモ（任意）
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: 2026新歓用"
              className={cn(inputClass, "w-56")}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              有効期限（日・任意）
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="無期限"
              className={cn(inputClass, "w-32")}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-6 border-t border-line pt-5 sm:grid-cols-2">
          {/* 汎用コード */}
          <div>
            <p className="font-medium">汎用コード</p>
            <p className="mt-1 text-sm text-ink-muted">
              誰でも使える使い捨てコード。先着1名で新規メンバーを作成します。人数分まとめて発行できます。
            </p>
            <div className="mt-3 flex items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                  個数
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  className={cn(inputClass, "w-24")}
                />
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => post({ kind: "generic", count, ...sharedFields() })}
                className={btnPrimary}
              >
                汎用コードを発行
              </button>
            </div>
          </div>

          {/* 個別コード */}
          <div>
            <p className="font-medium">個別コード</p>
            <p className="mt-1 text-sm text-ink-muted">
              指定した既存メンバー本人の紐付け専用。なりすまし不可。（連携済みのメンバーには不要）
            </p>
            <div className="mt-3 flex items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                  メンバー
                </span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={cn(inputClass, "w-56")}
                >
                  <option value="">選択してください</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.linked ? "（連携済み）" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={loading || !selectedUserId}
                onClick={() =>
                  post({ kind: "member", userId: selectedUserId, ...sharedFields() })
                }
                className={btnGhost}
              >
                個別コードを発行
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 一覧 ===== */}
      <div className="overflow-x-auto border border-line">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-muted text-left font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3">コード</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3">宛先</th>
              <th className="px-4 py-3">メモ</th>
              <th className="px-4 py-3">期限</th>
              <th className="px-4 py-3">発行</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tokens.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  まだコードがありません。上のパネルから発行してください。
                </td>
              </tr>
            )}
            {tokens.map((t) => {
              const used = Boolean(t.usedAt);
              return (
                <tr key={t.id} className={used ? "opacity-60" : ""}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => copy(t.code)}
                      title="クリックでコピー"
                      className="font-mono text-sm hover:text-accent"
                    >
                      {t.code}
                    </button>
                    {copied === t.code && (
                      <span className="ml-2 text-xs text-accent">コピーしました</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {used ? (
                      <Badge tone="muted">使用済</Badge>
                    ) : (
                      <Badge tone="accent">未使用</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.userId ? (t.targetName ?? "（不明なメンバー）") : "汎用"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.note ?? "—"}</td>
                  <td className="px-4 py-3">
                    {t.expiresAt ? (
                      <DateTime
                        value={t.expiresAt}
                        dateOnly
                        className="font-mono text-xs text-ink-muted"
                      />
                    ) : (
                      <span className="text-ink-subtle">無期限</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DateTime
                      value={t.createdAt}
                      dateOnly
                      className="font-mono text-xs text-ink-muted"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {!used && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => remove(t.id)}
                        className="border border-line px-2 py-1 font-mono text-xs text-ink-muted hover:border-danger hover:text-danger disabled:opacity-50"
                      >
                        削除
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
