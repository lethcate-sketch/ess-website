import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { defaultImage } from "@/lib/siteImages";

/**
 * 公開のサイト画像配信。
 * 管理画面で設定した画像（DB の SiteImage）があればそれを、無ければコード側のデフォルトを返す。
 * - data URL（アップロード画像）はデコードしてバイナリ配信
 * - ローカルパス / 外部URL はリダイレクト
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } },
) {
  const key = params.key;

  let url: string | undefined;
  try {
    const row = await prisma.siteImage.findUnique({ where: { key } });
    url = row?.url ?? undefined;
  } catch {
    // DB 未到達 / テーブル未作成時はデフォルトにフォールバック
  }
  if (!url) url = defaultImage(key);
  if (!url) return new NextResponse("Not found", { status: 404 });

  // data URL（アップロード画像）→ デコードして配信
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma === -1) return new NextResponse("Bad image", { status: 422 });
    const meta = url.slice(5, comma); // 例: "image/png;base64"
    const isBase64 = meta.includes(";base64");
    const contentType = meta.split(";")[0] || "application/octet-stream";
    const raw = url.slice(comma + 1);
    const body = isBase64
      ? Buffer.from(raw, "base64")
      : Buffer.from(decodeURIComponent(raw));
    return new NextResponse(body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=60",
      },
    });
  }

  // ローカルパス / 外部URL → リダイレクト。
  // 注意: Render の内部 origin は localhost:10000 のため new URL(.., origin) は使わない。
  // 絶対URL("https://…")はそのまま、ローカルパス("/images/…")は相対のまま返し、
  // ブラウザ側で公開URL(https://ess-web.onrender.com)に解決させる。
  return new NextResponse(null, {
    status: 307,
    headers: {
      location: url,
      "cache-control": "public, max-age=60",
    },
  });
}
