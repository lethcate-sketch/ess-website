/**
 * 画像ファイルをブラウザ側でリサイズ・圧縮して data URL 化する（クライアント専用）。
 * スマホで撮った大きな写真でも、軽量化してからアップロードできる。
 *
 * - maxDim: 長辺の最大ピクセル（超える分は縮小）
 * - format: "jpeg"（写真向け・小さい）/ "png"（透過を保つ）
 * - quality: JPEG の品質（0〜1）
 */
export async function fileToCompressedDataUrl(
  file: File,
  {
    maxDim = 1600,
    format = "jpeg",
    quality = 0.85,
  }: { maxDim?: number; format?: "png" | "jpeg"; quality?: number } = {},
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
  return canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", quality);
}
