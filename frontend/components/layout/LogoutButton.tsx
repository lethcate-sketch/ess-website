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
      className="text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
    >
      ログアウト
    </button>
  );
}
