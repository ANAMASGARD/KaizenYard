import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b-2 border-border px-6 py-4">
        <Link
          href="/"
          className="font-head text-lg tracking-tight transition-opacity hover:opacity-80"
        >
          &larr; Kaizenyard
        </Link>
        <ThemeToggle />
      </header>
      {children}
    </div>
  );
}
