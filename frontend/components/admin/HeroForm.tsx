"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { fileToCompressedDataUrl } from "@/lib/imageCompress";

/**
 * トップのヒーロー編集（タイトル・サブタイトル・背景画像をまとめて保存）。
 * 文章は PATCH /api/proxy/home、背景画像は PUT /api/proxy/admin/images/hero。
 */
export function HeroForm({
  initial,
}: {
  initial: { heroTitle: string; heroSubtitle: string };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initial.heroSubtitle);
  const [pendingImage, setPendingImage] = useState<string | null>(null); // 未保存の差し替え画像(data URL)
  const [imgVersion, setImgVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty = () => setSaved(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPendingImage(await fileToCompressedDataUrl(f, { format: "jpeg" }));
      dirty();
    } catch {
      setError("画像の読み込みに失敗しました。別の画像でお試しください。");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      if (pendingImage) {
        const r = await fetch("/api/proxy/admin/images/hero", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: pendingImage }),
        });
        if (!r.ok) {
          setError("背景画像の保存に失敗しました。");
          return;
        }
      }
      const res = await fetch("/api/proxy/home", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ heroTitle, heroSubtitle }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "保存に失敗しました。");
        return;
      }
      setPendingImage(null);
      setImgVersion((v) => v + 1);
      setSaved(true);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  const preview = pendingImage ?? `/api/images/hero?v=${imgVersion}`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      {saved && (
        <p className="border border-accent bg-accent-subtle px-3 py-2 text-sm text-ink">
          保存しました。
        </p>
      )}
      <div>
        <Label htmlFor="heroTitle">ヒーロータイトル</Label>
        <Input
          id="heroTitle"
          required
          value={heroTitle}
          onChange={(e) => {
            setHeroTitle(e.target.value);
            dirty();
          }}
        />
      </div>
      <div>
        <Label htmlFor="heroSubtitle">ヒーローサブタイトル</Label>
        <Textarea
          id="heroSubtitle"
          rows={3}
          value={heroSubtitle}
          onChange={(e) => {
            setHeroSubtitle(e.target.value);
            dirty();
          }}
        />
      </div>
      <div>
        <Label htmlFor="hero-image">背景画像</Label>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-muted ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="背景プレビュー" className="h-full w-full object-cover" />
          </div>
          <input
            ref={fileRef}
            id="hero-image"
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="block max-w-full text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
          />
        </div>
        <p className="mt-1 text-xs text-ink-subtle">
          横長の活動写真を推奨。選んだ画像は「保存する」で確定します。
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
