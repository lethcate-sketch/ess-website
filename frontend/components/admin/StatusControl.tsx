"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export function StatusControl({
  endpoint,
  id,
  current,
  options,
}: {
  endpoint: "participation-requests" | "contact";
  id: string;
  current: string;
  options: Option[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);

  async function onChange(v: string) {
    setStatus(v);
    setLoading(true);
    try {
      await fetch(`/api/proxy/${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: v }),
      });
    } catch {
      /* noop */
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
      className="border border-line bg-surface px-2 py-1 font-mono text-xs outline-none focus:border-accent disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
