import { NextResponse, type NextRequest } from "next/server";

import { flaskFetchAwake } from "@/lib/api";
import { setAuthCookiesOnResponse } from "@/lib/auth";

// POST /api/auth/register — 登録後そのままログイン状態にする（Cookie 格納）。
// Flask スリープ時も起床待ちリトライで失敗させない。
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await flaskFetchAwake("/api/auth/register", { method: "POST", body });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const fallback =
      res.status === 502 || res.status === 503
        ? "サーバーの起動に時間がかかっています。30秒ほど待って、もう一度お試しください。"
        : "登録に失敗しました。";
    return NextResponse.json(
      data ?? { error: { code: "REGISTER_FAILED", message: fallback } },
      { status: res.status },
    );
  }

  const out = NextResponse.json({ user: data?.user }, { status: 201 });
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}
