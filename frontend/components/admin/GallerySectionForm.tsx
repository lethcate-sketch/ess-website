"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { GalleryItem } from "@/lib/homeDefaults";
import { fileToCompressedDataUrl } from "@/lib/imageCompress";

type Row = GalleryItem & { pendingImage: string | null };

/**
 * トップの「Gallery」セクション編集。見出し＋項目（サムネイル画像・ラベル）をまとめて保存。
 * 項目の追加・削除に対応。画像は SiteImage の key "gallery-<id>" に保存。
 */
export function GallerySectionForm({
  initial,
}: {
  initial: { galleryEyebrow: string; galleryTitle: string; galleryItems: GalleryItem[] };
}) {
  const router = useRouter();
  const [eyebrow, setEyebrow] = useState(initial.galleryEyebrow);
  const [title, setTitle] = useState(initial.galleryTitle);
  const [items, setItems] = useState<Row[]>(
    initial.galleryItems.map((i) => ({ ...i, pendingImage: null })),
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
    setItems((prev) => [...prev, { id: crypto.randomUUID(), label: "", pendingImage: null }]);
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
      for (const it of items) {
        if (!it.pendingImage) continue;
        const r = await fetch(`/api/proxy/admin/images/gallery-${it.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: it.pendingImage }),
        });
        if (!r.ok) {
          setError(`「${it.label || "無題"}」の画像保存に失敗しました。`);
          return;
        }
      }
      const res = await fetch("/api/proxy/home", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          galleryEyebrow: eyebrow,
          galleryTitle: title,
          galleryItems: items.map((i) => ({ id: i.id, label: i.label })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error?.message ?? "保存に失敗しました。");
        return;
      }
      const currentIds = new Set(items.map((i) => i.id));
      for (const o of initial.galleryItems) {
        if (!currentIds.has(o.id)) {
          fetch(`/api/proxy/admin/images/gallery-${o.id}`, { method: "DELETE" }).catch(
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
          <Label htmlFor="gal-eyebrow">セクション小見出し（英字）</Label>
          <Input
            id="gal-eyebrow"
            value={eyebrow}
            onChange={(e) => {
              setEyebrow(e.target.value);
              dirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="gal-title">セクション見出し</Label>
          <Input
            id="gal-title"
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
          ギャラリー項目（{items.length}）
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((it, idx) => (
            <GalleryItemEditor
              key={it.id}
              item={it}
              imgVersion={imgVersion}
              onPickImage={(e) => onPickImage(idx, e)}
              onLabel={(v) => patchItem(idx, { label: v })}
              onRemove={() => removeItem(idx)}
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-sm text-ink-muted">項目がありません。下から追加してください。</p>
        )}
        <button
          type="button"
          onClick={addItem}
          className="border border-line px-4 py-2 text-sm transition-colors hover:border-accent"
        >
          ＋ ギャラリー項目を追加
        </button>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}

function GalleryItemEditor({
  item,
  imgVersion,
  onPickImage,
  onLabel,
  onRemove,
}: {
  item: Row;
  imgVersion: number;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLabel: (v: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = item.pendingImage ?? `/api/images/gallery-${item.id}?v=${imgVersion}`;
  return (
    <div className="border border-line p-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-muted ring-1 ring-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt={item.label} className="h-full w-full object-cover" />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPickImage}
        className="mt-2 block w-full text-xs file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
      />
      <div className="mt-2 flex items-center gap-2">
        <Input
          required
          placeholder="ラベル"
          value={item.label}
          onChange={(e) => onLabel(e.target.value)}
        />
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 border border-danger px-2.5 py-2 text-xs text-danger transition-colors hover:bg-danger-subtle"
        >
          削除
        </button>
      </div>
    </div>
  );
}
