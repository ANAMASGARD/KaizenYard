import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function AuthHeader() {
  return (
    <header className="flex items-center justify-between border-b-2 border-border bg-background px-6 py-4">
      <Link
        href="/"
        className="font-head text-lg tracking-tight text-foreground transition-opacity hover:opacity-80"
      >
        Kaizenyard
      </Link>
      <nav className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton mode="redirect">
            <button
              type="button"
              className="rounded border-2 border-border bg-transparent px-4 py-1.5 text-sm font-medium shadow-md transition hover:translate-y-0.5 hover:shadow-sm active:translate-y-1 active:shadow-none"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect">
            <button
              type="button"
              className="rounded border-2 border-border bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-md transition hover:translate-y-0.5 hover:bg-primary-hover hover:shadow-sm active:translate-y-1 active:shadow-none"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "border-2 border-border shadow-md",
              },
            }}
          />
        </Show>
      </nav>
    </header>
  );
}
