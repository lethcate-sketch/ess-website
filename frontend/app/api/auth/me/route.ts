import { NextResponse, type NextRequest } from "next/server";

import { flaskFetch } from "@/lib/api";
import { clearAuthCookiesOnResponse, setAuthCookiesOnResponse } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

// GET /api/auth/me — 現在のユーザー。未ログインは {user:null} を 200 で返す（クライアント判定用）。
// access 失効時は refresh で一度だけ再試行し、Cookie を更新する。
export async function GET(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return NextResponse.json({ user: null });

  let res = await flaskFetch("/api/auth/me", { method: "GET", accessToken: access });
  let rotated: { access: string; refresh: string } | null = null;

  if (res.status === 401 && refresh) {
    const rr = await flaskFetch("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (rr.ok) {
      const d = await rr.json();
      rotated = { access: d.accessToken, refresh: d.refreshToken };
      res = await flaskFetch("/api/auth/me", { method: "GET", accessToken: rotated.access });
    }
  }

  const data = await res.json().catch(() => ({}));
  const out = NextResponse.json({ user: res.ok ? data.user : null });
  if (rotated) setAuthCookiesOnResponse(out, rotated.access, rotated.refresh);
  else if (res.status === 401) clearAuthCookiesOnResponse(out);
  return out;
}
