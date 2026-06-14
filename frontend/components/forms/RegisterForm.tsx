"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    nameKana: "",
    grade: "",
    department: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        email: form.email,
        password: form.password,
        name: form.name,
      };
      for (const k of ["nameKana", "grade", "department"] as const) {
        if (form[k].trim()) payload[k] = form[k].trim();
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "登録に失敗しました。");
        return;
      }
      router.push("/mypage");
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
        <Label htmlFor="name">氏名</Label>
        <Input id="name" required value={form.name} onChange={set("name")} />
      </div>
      <div>
        <Label htmlFor="nameKana">氏名（カナ）</Label>
        <Input id="nameKana" value={form.nameKana} onChange={set("nameKana")} />
      </div>
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set("email")}
        />
      </div>
      <div>
        <Label htmlFor="password">パスワード（8文字以上）</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={set("password")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="grade">学年</Label>
          <Input id="grade" value={form.grade} onChange={set("grade")} />
        </div>
        <div>
          <Label htmlFor="department">学部・学科</Label>
          <Input id="department" value={form.department} onChange={set("department")} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "登録中..." : "登録する"}
      </Button>
    </form>
  );
}
