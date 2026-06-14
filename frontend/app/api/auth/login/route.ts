import { NextResponse, type NextRequest } from "next/server";

import { flaskFetch } from "@/lib/api";
import { setAuthCookiesOnResponse } from "@/lib/auth";

// POST /api/auth/login — Flask でログインし、返ってきた JWT を httpOnly Cookie に格納する。
export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await flaskFetch("/api/auth/login", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const out = NextResponse.json({ user: data.user });
  setAuthCookiesOnResponse(out, data.accessToken, data.refreshToken);
  return out;
}
