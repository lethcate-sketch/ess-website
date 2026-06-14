"use client";

import { useState } from "react";

import { FormSuccess } from "@/components/forms/FormSuccess";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

export function JoinForm({ eventId }: { eventId?: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "TRIAL",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/participation-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, ...(eventId ? { eventId } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "送信に失敗しました。");
        return;
      }
      setDone(true);
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <FormSuccess
        title="お申し込みを受け付けました"
        message="担当者より追ってご連絡いたします。ありがとうございました。"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="name">お名前</Label>
        <Input id="name" required value={form.name} onChange={set("name")} />
      </div>
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
        />
      </div>
      <div>
        <Label>種別</Label>
        <div className="flex gap-5 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="TRIAL"
              checked={form.type === "TRIAL"}
              onChange={set("type")}
              className="accent-accent"
            />
            見学（体験）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="JOIN"
              checked={form.type === "JOIN"}
              onChange={set("type")}
              className="accent-accent"
            />
            入会
          </label>
        </div>
      </div>
      <div>
        <Label htmlFor="message">メッセージ（任意）</Label>
        <Textarea id="message" rows={4} value={form.message} onChange={set("message")} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "送信中..." : "申し込む"}
      </Button>
    </form>
  );
}
