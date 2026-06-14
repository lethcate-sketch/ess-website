/**
 * JWT / Cookie ヘルパー（サーバ専用 / §4 lib/auth.ts）。
 * - httpOnly Cookie に access / refresh を格納（ブラウザ JS から不可視 / §3-4, §12-④）。
 * - server component からの認証状態取得は getSession()（jose で検証）。
 * 注: middleware(Edge) はこのモジュールを import しない（next/headers 非対応のため）。
 */
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";

const isProd = process.env.NODE_ENV === "production";
const accessMaxAge = () => 60 * Number(process.env.JWT_ACCESS_EXPIRES_MIN ?? 15);
const refreshMaxAge = () =>
  60 * 60 * 24 * Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 14);

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setAuthCookiesOnResponse(
  res: NextResponse,
  access: string,
  refresh: string,
): void {
  res.cookies.set(ACCESS_COOKIE, access, cookieOpts(accessMaxAge()));
  res.cookies.set(REFRESH_COOKIE, refresh, cookieOpts(refreshMaxAge()));
}

export function clearAuthCookiesOnResponse(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", cookieOpts(0));
  res.cookies.set(REFRESH_COOKIE, "", cookieOpts(0));
}

export type Session = { sub: string; role: string; email?: string };

/** server component 用: access Cookie を検証して現在のセッションを返す（無効なら null）。 */
export async function getSession(): Promise<Session | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );
    return {
      sub: String(payload.sub ?? ""),
      role: String((payload as Record<string, unknown>).role ?? "MEMBER"),
      email: (payload as Record<string, unknown>).email as string | undefined,
    };
  } catch {
    return null;
  }
}

export function getRefreshCookie(): string | undefined {
  return cookies().get(REFRESH_COOKIE)?.value;
}
