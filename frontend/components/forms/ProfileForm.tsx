"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { CameraIcon, UserIcon } from "@/components/ui/Icons";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { fileToCompressedDataUrl } from "@/lib/imageCompress";

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
  const fileRef = useRef<HTMLInputElement>(null);
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
  const [avatarBusy, setAvatarBusy] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setSaved(false);
    };

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarBusy(true);
    setSaved(false);
    setError(null);
    try {
      // アバターは正方形表示なので 512px・JPEG に軽量化
      const dataUrl = await fileToCompressedDataUrl(f, { maxDim: 512, format: "jpeg" });
      setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch {
      setError("画像の読み込みに失敗しました。別の画像でお試しください。");
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
    <form onSubmit={onSubmit} className="space-y-5">
      <FormError message={error} />
      {saved && (
        <p className="rounded-xl border border-mint-200 bg-mint-50 px-3 py-2 text-sm text-navy">
          保存しました。
        </p>
      )}

      {/* アバター（ファイルアップロード） */}
      <div>
        <Label htmlFor="avatar">アバター画像</Label>
        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-2 ring-line">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt="アバター" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-brand-300">
                <UserIcon className="h-9 w-9" />
              </span>
            )}
          </div>
          <div className="flex flex-col items-start gap-2">
            <input
              ref={fileRef}
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-50"
            >
              <CameraIcon className="h-4 w-4" />
              {avatarBusy ? "処理中..." : "写真を選ぶ"}
            </button>
            {form.avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, avatarUrl: "" }));
                  setSaved(false);
                }}
                className="text-xs text-ink-muted transition-colors hover:text-danger"
              >
                削除
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-subtle">
          スマホの写真フォルダやカメラからも選べます。自動で軽量化されます。「保存する」で確定します。
        </p>
      </div>

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
        <Label htmlFor="bio">自己紹介</Label>
        <Textarea id="bio" rows={4} value={form.bio} onChange={set("bio")} />
      </div>
      <Button type="submit" disabled={loading || avatarBusy}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
