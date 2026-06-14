"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { EVENT_STATUS_LABEL, EVENT_TYPE_LABEL } from "@/lib/labels";

const TYPES = ["REGULAR", "SPECIAL", "SOCIAL", "EXTERNAL"];
const STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"];
const SELECT_CLS =
  "w-full border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

// UTC ISO -> datetime-local 入力値（ローカル時刻）。§3-7。
function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Initial = {
  id?: string;
  title?: string;
  description?: string | null;
  type?: string;
  startAt?: string;
  endAt?: string;
  location?: string | null;
  capacity?: number | null;
  status?: string;
  isPublic?: boolean;
};

export function EventForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    type: initial?.type ?? "REGULAR",
    startAt: toLocalInput(initial?.startAt),
    endAt: toLocalInput(initial?.endAt),
    location: initial?.location ?? "",
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    status: initial?.status ?? "DRAFT",
    isPublic: initial?.isPublic ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        location: form.location || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status,
        isPublic: form.isPublic,
      };
      const res = await fetch(
        isEdit ? `/api/proxy/events/${initial!.id}` : "/api/proxy/events",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "保存に失敗しました。");
        return;
      }
      router.push("/dashboard/events");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" required value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">種別</Label>
          <select id="type" value={form.type} onChange={(e) => set("type", e.target.value)} className={SELECT_CLS}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">状態</Label>
          <select id="status" value={form.status} onChange={(e) => set("status", e.target.value)} className={SELECT_CLS}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {EVENT_STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="startAt">開始</Label>
          <Input id="startAt" type="datetime-local" required value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endAt">終了</Label>
          <Input id="endAt" type="datetime-local" required value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">場所</Label>
          <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="capacity">定員</Label>
          <Input id="capacity" type="number" min="0" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => set("isPublic", e.target.checked)}
          className="accent-accent"
        />
        公開する（isPublic）
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : isEdit ? "更新する" : "作成する"}
      </Button>
    </form>
  );
}
