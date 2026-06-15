import { NextResponse, type NextRequest } from "next/server";

import { FLASK_API_BASE_URL, withWakeRetry } from "@/lib/api";
import { setAuthCookiesOnResponse } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

/**
 * 汎用 BFF プロキシ（§4 api/proxy/[...path]）。
 * クライアントからの要求に Cookie の access を Authorization: Bearer として付与し Flask へ中継する。
 * 401 のときは refresh で一度だけ再発行→再試行し、新トークンを Cookie に反映する。
 * トークン自体はクライアントへ返さない（§3-4）。
 */
async function handle(
  req: NextRequest,
  ctx: { params: { path: string[] } },
): Promise<NextResponse> {
  const target = `${FLASK_API_BASE_URL}/api/${ctx.params.path.join("/")}${req.nextUrl.search}`;
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.text() : undefined;

  const call = (token?: string) =>
    fetch(target, {
      method: req.method,
      headers: {
        "content-type": req.headers.get("content-type") ?? "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
    });

  // Flask スリープ時(502/503)は起床待ちリトライしてからレスポンスを得る。
  let res = await withWakeRetry(() => call(access));
  let rotated: { access: string; refresh: string } | null = null;

  if (res.status === 401 && refresh) {
    const rr = await fetch(`${FLASK_API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    });
    if (rr.ok) {
      const d = await rr.json();
      rotated = { access: d.accessToken, refresh: d.refreshToken };
      res = await call(rotated.access);
    }
  }

  const text = await res.text();
  const out = new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
  if (rotated) setAuthCookiesOnResponse(out, rotated.access, rotated.refresh);
  return out;
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
