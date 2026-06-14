"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

export function CircleInfoForm({
  initial,
}: {
  initial: { about: string; frequency: string };
}) {
  const router = useRouter();
  const [about, setAbout] = useState(initial.about);
  const [frequency, setFrequency] = useState(initial.frequency);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/proxy/circle/info", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ about, frequency }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "保存に失敗しました。");
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
      <div>
        <Label htmlFor="about">活動内容</Label>
        <Textarea id="about" rows={5} value={about} onChange={(e) => setAbout(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="frequency">活動頻度（曜日・週何回など）</Label>
        <Input id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
