"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button, buttonVariants } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

export function HeroDashboardCta() {
  return (
    <div className="animate-hero-description">
      <Show when="signed-in">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "default", size: "md" }),
            "inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]",
          )}
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Dashboard
        </Link>
      </Show>
      <Show when="signed-out">
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <Button
            size="md"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em]"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Button>
        </SignInButton>
      </Show>
    </div>
  );
}
