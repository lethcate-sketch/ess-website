export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border border-danger bg-danger-subtle px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}
