"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ManagedImage } from "@/lib/siteImages";

/**
 * 画像をブラウザ側でリサイズ・圧縮して data URL 化する。
 * 大きな写真でも DB/通信が重くならないよう、最大辺 1600px・JPEG 品質 0.85 に変換。
 * ロゴ等は透過を保つため PNG（無圧縮）で出力。
 */
async function fileToDataUrl(
  file: File,
  format: "png" | "jpeg" = "jpeg",
  maxDim = 1600,
): Promise<string> {
  const readDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(f);
    });

  const original = await readDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("decode failed"));
    im.src = original;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.85);
}

function ImageRow({ image }: { image: ManagedImage }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [version, setVersion] = useState(0); // プレビューのキャッシュ破棄用
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = `/api/images/${image.key}?v=${version}`;

  async function send(method: "PUT" | "DELETE", body?: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/proxy/admin/images/${image.key}`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d?.error?.message ?? "更新に失敗しました。");
        return;
      }
      setUrlInput("");
      setVersion((v) => v + 1);
      router.refresh();
    } catch {
      window.alert("通信エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(f, image.format ?? "jpeg");
      await send("PUT", { url: dataUrl });
    } catch {
      window.alert("画像の読み込みに失敗しました。");
      setBusy(false);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-muted ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={image.label}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{image.label}</p>
          {image.hint && <p className="mt-0.5 text-xs text-ink-subtle">{image.hint}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={busy}
          className="block max-w-full text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand-600 hover:file:bg-brand-100"
        />
        <button
          type="button"
          onClick={() => send("DELETE")}
          disabled={busy}
          className="rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          デフォルトに戻す
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="またはURLを貼り付け（https://… または /images/…）"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm focus:border-brand-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => urlInput.trim() && send("PUT", { url: urlInput.trim() })}
          disabled={busy || !urlInput.trim()}
          className="shrink-0 rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-semibold text-white transition-all hover:shadow-soft disabled:opacity-50"
        >
          適用
        </button>
      </div>

      {busy && <p className="mt-2 text-xs text-ink-subtle">処理中…</p>}
    </div>
  );
}

export function ImageManager({ images }: { images: ManagedImage[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {images.map((img) => (
        <ImageRow key={img.key} image={img} />
      ))}
    </div>
  );
}
