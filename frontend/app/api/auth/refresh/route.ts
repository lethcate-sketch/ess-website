import { NextResponse, type NextRequest } from "next/server";

import { flaskFetch } from "@/lib/api";
import { clearAuthCookiesOnResponse, setAuthCookiesOnResponse } from "@/lib/auth";
import { REFRESH_COOKIE } from "@/lib/cookies";

// 安全な内部パスのみ許可（オープンリダイレクト防止）。
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

// POST /api/auth/refresh — クライアント用。Cookie の refresh で再発行し Cookie を更新。
export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "リフレッシュトークンがありません。" } },
      { status: 401 },
    );
  }
  const res = await flaskFetch("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refresh }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const out = NextResponse.json(data, { status: res.status });
    clearAuthCookiesOnResponse(out);
    return out;
  }
  const out = NextResponse.json({ user: data.user });
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}

// GET /api/auth/refresh?next=/path — middleware からのリダイレクト用。
// access 失効時にセッションを復元してから元のパスへ戻す（失敗時は /login へ）。
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", next);

  if (!refresh) return NextResponse.redirect(loginUrl);

  const res = await flaskFetch("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    const out = NextResponse.redirect(loginUrl);
    clearAuthCookiesOnResponse(out);
    return out;
  }
  const data = await res.json();
  const out = NextResponse.redirect(new URL(next, req.url));
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}
