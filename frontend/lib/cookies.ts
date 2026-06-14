// 認証 Cookie 名。middleware(Edge) と route handler / server component で共有するため、
// next/headers 等を import しない純粋な定数モジュールにしておく。
export const ACCESS_COOKIE = "ess_access";
export const REFRESH_COOKIE = "ess_refresh";
