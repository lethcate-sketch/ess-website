"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import type { FeatureItem } from "@/lib/homeDefaults";
import { fileToCompressedDataUrl } from "@/lib/imageCompress";

type Row = FeatureItem & { pendingImage: string | null };

/**
 * トップの「Why ESS」セクション編集。見出し（eyebrow/title）＋項目（画像・タイトル・本文）を
 * まとめて保存。項目の追加・削除に対応。画像は SiteImage の key "feature-<id>" に保存。
 */
export function FeatureSectionForm({
  initial,
}: {
  initial: { featureEyebrow: string; featureTitle: string; featureItems: FeatureItem[] };
}) {
  const router = useRouter();
  const [eyebrow, setEyebrow] = useState(initial.featureEyebrow);
  const [title, setTitle] = useState(initial.featureTitle);
  const [items, setItems] = useState<Row[]>(
    initial.featureItems.map((i) => ({ ...i, pendingImage: null })),
  );
  const [imgVersion, setImgVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const dirty = () => setSaved(false);
  const patchItem = (idx: number, patch: Partial<Row>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    dirty();
  };
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "", body: "", pendingImage: null },
    ]);
    dirty();
  };
  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    dirty();
  };

  async function onPickImage(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      patchItem(idx, { pendingImage: await fileToCompressedDataUrl(f, { format: "jpeg" }) });
    } catch {
      setError("画像の読み込みに失敗しました。");
    } finally {
      e.target.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      // 1) 変更された項目画像をアップロード
      for (const it of items) {
        if (!it.pendingImage) continue;
        const r = await fetch(`/api/proxy/admin/images/feature-${it.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: it.pendingImage }),
        });
        if (!r.ok) {
          setError(`「${it.title || "無題"}」の画像保存に失敗しました。`);
          return;
        }
      }
      // 2) 見出し＋項目を保存
      const res = await fetch("/api/proxy/home", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          featureEyebrow: eyebrow,
          featureTitle: title,
          featureItems: items.map((i) => ({ id: i.id, title: i.title, body: i.body })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "保存に失敗しました。");
        return;
      }
      // 3) 削除された項目の画像を後始末（冪等）
      const currentIds = new Set(items.map((i) => i.id));
      for (const o of initial.featureItems) {
        if (!currentIds.has(o.id)) {
          fetch(`/api/proxy/admin/images/feature-${o.id}`, { method: "DELETE" }).catch(
            () => {},
          );
        }
      }
      setItems((prev) => prev.map((it) => ({ ...it, pendingImage: null })));
      setImgVersion((v) => v + 1);
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="feat-eyebrow">セクション小見出し（英字）</Label>
          <Input
            id="feat-eyebrow"
            value={eyebrow}
            onChange={(e) => {
              setEyebrow(e.target.value);
              dirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="feat-title">セクション見出し</Label>
          <Input
            id="feat-title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              dirty();
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
          フィーチャー項目（{items.length}）
        </p>
        {items.map((it, idx) => (
          <FeatureItemEditor
            key={it.id}
            item={it}
            imgVersion={imgVersion}
            onPickImage={(e) => onPickImage(idx, e)}
            onTitle={(v) => patchItem(idx, { title: v })}
            onBody={(v) => patchItem(idx, { body: v })}
            onRemove={() => removeItem(idx)}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink-muted">項目がありません。下から追加してください。</p>
        )}
        <button
          type="button"
          onClick={addItem}
          className="border border-line px-4 py-2 text-sm transition-colors hover:border-accent"
        >
          ＋ フィーチャー項目を追加
        </button>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}

function FeatureItemEditor({
  item,
  imgVersion,
  onPickImage,
  onTitle,
  onBody,
  onRemove,
}: {
  item: Row;
  imgVersion: number;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = item.pendingImage ?? `/api/images/feature-${item.id}?v=${imgVersion}`;
  return (
    <div className="border border-line p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="space-y-2">
          <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-surface-muted ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={item.title} className="h-full w-full object-cover" />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="block w-32 text-xs file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            required
            placeholder="タイトル"
            value={item.title}
            onChange={(e) => onTitle(e.target.value)}
          />
          <Textarea
            rows={2}
            placeholder="本文"
            value={item.body}
            onChange={(e) => onBody(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="border border-danger px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-subtle"
        >
          削除
        </button>
      </div>
    </div>
  );
}
