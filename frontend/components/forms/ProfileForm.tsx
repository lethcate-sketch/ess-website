"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type Initial = {
  name: string;
  nameKana: string | null;
  grade: string | null;
  department: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name ?? "",
    nameKana: initial.nameKana ?? "",
    grade: initial.grade ?? "",
    department: initial.department ?? "",
    bio: initial.bio ?? "",
    avatarUrl: initial.avatarUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setSaved(false);
    };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/proxy/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "保存に失敗しました。");
        return;
      }
      setSaved(true);
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
      {saved && (
        <p className="border border-accent bg-accent-subtle px-3 py-2 text-sm text-ink">
          保存しました。
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">氏名</Label>
          <Input id="name" required value={form.name} onChange={set("name")} />
        </div>
        <div>
          <Label htmlFor="nameKana">氏名（カナ）</Label>
          <Input id="nameKana" value={form.nameKana} onChange={set("nameKana")} />
        </div>
        <div>
          <Label htmlFor="grade">学年</Label>
          <Input id="grade" value={form.grade} onChange={set("grade")} />
        </div>
        <div>
          <Label htmlFor="department">学部・学科</Label>
          <Input id="department" value={form.department} onChange={set("department")} />
        </div>
      </div>
      <div>
        <Label htmlFor="avatarUrl">アバター画像URL</Label>
        <Input id="avatarUrl" value={form.avatarUrl} onChange={set("avatarUrl")} />
      </div>
      <div>
        <Label htmlFor="bio">自己紹介</Label>
        <Textarea id="bio" rows={4} value={form.bio} onChange={set("bio")} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
