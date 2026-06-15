import { getSession } from "@/lib/auth";
import { HeaderNav } from "./HeaderNav";

/**
 * 公開ヘッダー。セッションはサーバーで取得し、見た目・スクロール挙動は
 * クライアントの HeaderNav に委譲する（§3-4: トークンはサーバ側でのみ扱う）。
 */
export async function Header() {
  const session = await getSession();
  return (
    <HeaderNav isLoggedIn={Boolean(session)} isAdmin={session?.role === "ADMIN"} />
  );
}
