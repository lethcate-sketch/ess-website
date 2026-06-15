import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * メンバーのアバター配信。
 * User.avatarUrl（マイページでアップロード／data URL）があればそれを、無ければ
 * デフォルトのアバター（人物アイコンSVG）を返す。
 * 一覧に data URL を直接埋め込むとHTMLが肥大化するため、軽量な参照用に分離している。
 */

// 未設定時のデフォルトアバター
const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96"><rect width="96" height="96" fill="#EAF6FF"/><circle cx="48" cy="38" r="16" fill="#7CC4FF"/><path d="M18 88a30 30 0 0 1 60 0Z" fill="#7CC4FF"/></svg>`;

function defaultAvatar() {
  return new NextResponse(DEFAULT_AVATAR_SVG, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=60",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  let url: string | undefined;
  try {
    const u = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { avatarUrl: true, isActive: true },
    });
    if (u?.isActive) url = u.avatarUrl ?? undefined;
  } catch {
    // DB 未到達時はデフォルト
  }
  if (!url) return defaultAvatar();

  // data URL（アップロード画像）→ デコードして配信
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    if (comma === -1) return defaultAvatar();
    const meta = url.slice(5, comma); // 例: "image/jpeg;base64"
    const isBase64 = meta.includes(";base64");
    const contentType = meta.split(";")[0] || "application/octet-stream";
    const raw = url.slice(comma + 1);
    const body = isBase64
      ? Buffer.from(raw, "base64")
      : Buffer.from(decodeURIComponent(raw));
    return new NextResponse(body, {
      headers: { "content-type": contentType, "cache-control": "public, max-age=60" },
    });
  }

  // 外部URL / ローカルパス → リダイレクト（絶対URLはそのまま・相対はブラウザが解決）
  return new NextResponse(null, {
    status: 307,
    headers: { location: url, "cache-control": "public, max-age=60" },
  });
}
