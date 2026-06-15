"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* noop */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-full px-3.5 py-1.5 font-medium text-ink-muted transition-all duration-200 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
    >
      ログアウト
    </button>
  );
}
