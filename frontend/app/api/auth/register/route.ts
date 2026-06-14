import { NextResponse, type NextRequest } from "next/server";

import { flaskFetch } from "@/lib/api";
import { setAuthCookiesOnResponse } from "@/lib/auth";

// POST /api/auth/register — 登録後そのままログイン状態にする（Cookie 格納）。
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await flaskFetch("/api/auth/register", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const out = NextResponse.json({ user: data.user }, { status: 201 });
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}
