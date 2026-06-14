import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, jwtVerify } from "jose";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

/**
 * 保護ルートの認可（§7）。
 * - (member): /members /mypage … 要ログイン（🔑）
 * - (admin) : /dashboard … role=ADMIN（👑）
 * access JWT を検証（§7 の「Cookie の JWT を検証」）。失効していて refresh があれば
 * セッション復元（/api/auth/refresh）へ。未ログインは /login へ。
 * 真の権限境界は Flask（admin_required で 403 / §12-③）であり、ここは UX ゲート。
 */
const MEMBER_PREFIXES = ["/members", "/mypage"];
const ADMIN_PREFIXES = ["/dashboard"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

async function readAccess(token?: string) {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      return payload;
    } catch {
      return null;
    }
  }
  // 秘密が無い場合のフォールバック（無限リダイレクト防止）: 署名検証せず exp のみ確認。
  try {
    const p = decodeJwt(token);
    if (p.exp && p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isMember = matches(pathname, MEMBER_PREFIXES);
  const isAdmin = matches(pathname, ADMIN_PREFIXES);
  if (!isMember && !isAdmin) return NextResponse.next();

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const payload = await readAccess(access);

  if (payload) {
    if (isAdmin && (payload as Record<string, unknown>).role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url)); // ログイン済・権限不足
    }
    return NextResponse.next();
  }

  if (refresh) {
    const url = new URL("/api/auth/refresh", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/members/:path*", "/mypage/:path*", "/dashboard/:path*"],
};
