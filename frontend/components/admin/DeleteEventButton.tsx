"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!window.confirm("このイベントをアーカイブします。よろしいですか？")) return;
    setLoading(true);
    try {
      await fetch(`/api/proxy/events/${eventId}`, { method: "DELETE" });
    } catch {
      /* noop */
    }
    router.push("/dashboard/events");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="border border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger-subtle disabled:opacity-50"
    >
      アーカイブする
    </button>
  );
}
