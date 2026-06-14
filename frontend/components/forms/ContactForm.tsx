"use client";

import { useState } from "react";

import { FormSuccess } from "@/components/forms/FormSuccess";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
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
      const res = await fetch("/api/proxy/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
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
        title="お問い合わせを受け付けました"
        message="内容を確認のうえ、担当者よりご連絡いたします。"
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
        <Label htmlFor="subject">件名</Label>
        <Input id="subject" required value={form.subject} onChange={set("subject")} />
      </div>
      <div>
        <Label htmlFor="message">お問い合わせ内容</Label>
        <Textarea
          id="message"
          rows={5}
          required
          value={form.message}
          onChange={set("message")}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "送信中..." : "送信する"}
      </Button>
    </form>
  );
}
