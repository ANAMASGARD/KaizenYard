import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-black px-6 py-4">
        <Link
          href="/"
          className="font-head text-lg tracking-tight transition-opacity hover:opacity-80"
        >
          &larr; Kaizenyard
        </Link>
      </header>
      {children}
    </div>
  );
}
