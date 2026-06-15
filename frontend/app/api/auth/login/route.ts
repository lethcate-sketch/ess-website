import { NextResponse, type NextRequest } from "next/server";

import { flaskFetchAwake } from "@/lib/api";
import { setAuthCookiesOnResponse } from "@/lib/auth";

// POST /api/auth/login — Flask でログインし、返ってきた JWT を httpOnly Cookie に格納する。
// Render 無料プランで Flask がスリープしていても、起床待ちリトライで失敗させない。
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await flaskFetchAwake("/api/auth/login", { method: "POST", body });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // data が Flask の標準エラー(401など)ならその専用メッセージを表示。
    // data が null（503/HTML 等＝起床しきれず）なら起床中である旨を案内する。
    const fallback =
      res.status === 502 || res.status === 503
        ? "サーバーの起動に時間がかかっています。30秒ほど待って、もう一度お試しください。"
        : "ログインに失敗しました。";
    return NextResponse.json(
      data ?? { error: { code: "LOGIN_FAILED", message: fallback } },
      { status: res.status },
    );
  }

  const out = NextResponse.json({ user: data?.user });
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}
