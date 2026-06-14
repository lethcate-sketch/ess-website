import { ContactForm } from "@/components/forms/ContactForm";

export const metadata = { title: "お問い合わせ" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">お問い合わせ</h1>
      <p className="mt-2 text-ink-muted">
        ご質問・ご相談はこちらのフォームからお送りください。
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </main>
  );
}
