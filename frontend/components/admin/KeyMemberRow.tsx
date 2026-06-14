"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type M = { id: string; name: string; role: string; bio: string | null; orderIndex: number };

export function KeyMemberRow({ member }: { member: M }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: member.name,
    role: member.role,
    bio: member.bio ?? "",
    orderIndex: String(member.orderIndex),
  });
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setLoading(true);
    try {
      await fetch(`/api/proxy/circle/key-members/${member.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          role: f.role,
          bio: f.bio || null,
          orderIndex: Number(f.orderIndex) || 0,
        }),
      });
    } catch {
      /* noop */
    }
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`「${f.name}」を削除しますか？`)) return;
    setLoading(true);
    try {
      await fetch(`/api/proxy/circle/key-members/${member.id}`, { method: "DELETE" });
    } catch {
      /* noop */
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`name-${member.id}`}>氏名</Label>
          <Input id={`name-${member.id}`} value={f.name} onChange={set("name")} />
        </div>
        <div>
          <Label htmlFor={`role-${member.id}`}>役職</Label>
          <Input id={`role-${member.id}`} value={f.role} onChange={set("role")} />
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor={`bio-${member.id}`}>紹介文</Label>
        <Textarea id={`bio-${member.id}`} rows={2} value={f.bio} onChange={set("bio")} />
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="w-28">
          <Label htmlFor={`order-${member.id}`}>表示順</Label>
          <Input id={`order-${member.id}`} type="number" min="0" value={f.orderIndex} onChange={set("orderIndex")} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" disabled={loading} onClick={save}>
            保存
          </Button>
          <button
            type="button"
            disabled={loading}
            onClick={remove}
            className="border border-danger px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-subtle disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
