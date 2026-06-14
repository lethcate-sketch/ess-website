"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

const EMPTY = { name: "", role: "", bio: "", orderIndex: "0" };

export function AddKeyMemberForm() {
  const router = useRouter();
  const [f, setF] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/circle/key-members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          role: f.role,
          bio: f.bio || null,
          orderIndex: Number(f.orderIndex) || 0,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "追加に失敗しました。");
        return;
      }
      setF({ ...EMPTY });
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormError message={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="km-name">氏名</Label>
          <Input id="km-name" required value={f.name} onChange={set("name")} />
        </div>
        <div>
          <Label htmlFor="km-role">役職（例: 副リーダー）</Label>
          <Input id="km-role" required value={f.role} onChange={set("role")} />
        </div>
      </div>
      <div>
        <Label htmlFor="km-bio">紹介文</Label>
        <Textarea id="km-bio" rows={2} value={f.bio} onChange={set("bio")} />
      </div>
      <div className="flex items-end gap-3">
        <div className="w-28">
          <Label htmlFor="km-order">表示順</Label>
          <Input id="km-order" type="number" min="0" value={f.orderIndex} onChange={set("orderIndex")} />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "追加中..." : "メンバーを追加"}
        </Button>
      </div>
    </form>
  );
}
