import Link from "next/link";

import { EventForm } from "@/components/admin/EventForm";

export const metadata = { title: "イベント作成" };

export default function NewEventPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/dashboard/events" className="font-mono text-xs text-ink-muted hover:text-accent">
        ← イベント管理
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">イベント作成</h1>
      <div className="mt-8">
        <EventForm />
      </div>
    </main>
  );
}
