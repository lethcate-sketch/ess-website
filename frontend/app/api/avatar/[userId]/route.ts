import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * メンバーのアバター配信。
 * User.avatarUrl（マイページでアップロード／data URL）があればそれを、無ければ
 * デフォルトのアバター（人物アイコンSVG）を返す。
 * 一覧に data URL を直接埋め込むとHTMLが肥大化するため、軽量な参照用に分離している。
 *
 * キャッシュ: User.updatedAt を ETag にして must-revalidate で配信する。マイページで
 * アバターを差し替えると updatedAt が進み ETag が変わるため、`?v=` を付けずに参照している
 * 箇所（ヘッダー等）でも**即座に更新**される（未変更時は 304 で軽量）。
 */

// 未設定時のデフォルトアバター
const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><rect width="96" height="96" fill="#EAF6FF"/><circle cx="48" cy="38" r="16" fill="#7CC4FF"/><path d="M18 88a30 30 0 0 1 60 0Z" fill="#7CC4FF"/></svg>`;

function defaultAvatar(cache: Record<string, string>) {
  return new NextResponse(DEFAULT_AVATAR_SVG, {
    headers: { "content-type": "image/svg+xml", ...cache },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  let url: string | undefined;
  let version = "default";
  try {
    const u = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { avatarUrl: true, isActive: true, updatedAt: true },
    });
    if (u?.isActive) {
      url = u.avatarUrl ?? undefined;
      if (url) version = String(u.updatedAt.getTime());
    }
  } catch {
    // DB 未到達時はデフォルト
  }

  // 差し替えで updatedAt が進む → ETag が変わる → ブラウザが新アバターを取得する。
  const etag = `"${params.userId}-${version}"`;
  const cache = { etag, "cache-control": "public, max-age=0, must-revalidate" };
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: cache });
  }

  if (!url) return defaultAvatar(cache);

  // data URL（アップロード画像）→ デコードして配信
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma === -1) return defaultAvatar(cache);
    const meta = url.slice(5, comma); // 例: "image/jpeg;base64"
    const isBase64 = meta.includes(";base64");
    const contentType = meta.split(";")[0] || "application/octet-stream";
    const raw = url.slice(comma + 1);
    const body = isBase64
      ? Buffer.from(raw, "base64")
      : Buffer.from(decodeURIComponent(raw));
    return new NextResponse(body, {
      headers: { "content-type": contentType, ...cache },
    });
  }

  // 外部URL / ローカルパス → リダイレクト（絶対URLはそのまま・相対はブラウザが解決）
  return new NextResponse(null, {
    status: 307,
    headers: { location: url, ...cache },
  });
}
