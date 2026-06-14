import { NextResponse, type NextRequest } from "next/server";

import { flaskFetch } from "@/lib/api";
import { clearAuthCookiesOnResponse } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

// POST /api/auth/logout — Flask 側でリフレッシュトークンを失効させ、Cookie をクリアする。
export async function POST(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (refresh) {
    await flaskFetch("/api/auth/logout", {
      method: "POST",
      accessToken: access,
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => undefined);
  }

  const out = NextResponse.json({ ok: true });
  clearAuthCookiesOnResponse(out);
  return out;
}
