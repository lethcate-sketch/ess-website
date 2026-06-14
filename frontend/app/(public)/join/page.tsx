import { JoinForm } from "@/components/forms/JoinForm";

export const metadata = { title: "見学・参加申し込み" };

export default function JoinPage({
  searchParams,
}: {
  searchParams: { eventId?: string };
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">見学・参加申し込み</h1>
      <p className="mt-2 text-ink-muted">
        見学（体験）・入会のお申し込みフォームです。英語レベルは問いません。お気軽にどうぞ。
      </p>
      <div className="mt-8">
        <JoinForm eventId={searchParams.eventId} />
      </div>
    </main>
  );
}
