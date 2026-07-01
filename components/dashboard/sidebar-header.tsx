"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NeoHamburgerButton } from "@/components/dashboard/neo-hamburger-button";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { cn } from "@/lib/utils";

export function SidebarHeader({
  forceExpanded = false,
}: {
  forceExpanded?: boolean;
}) {
  const { collapsed, toggleCollapsed } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-center border-b-2 border-border",
        isCollapsed
          ? "flex-col gap-2 px-1.5 py-3"
          : "justify-between gap-2 px-3 py-3",
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center transition-opacity hover:opacity-80",
          isCollapsed ? "justify-center" : "gap-2 font-head text-sm tracking-tight",
        )}
        title="Kaizenyard"
      >
        <Logo className="size-7 shrink-0" />
        {!isCollapsed && <span>Kaizenyard</span>}
      </Link>
      <NeoHamburgerButton
        className="hidden lg:flex"
        onClick={toggleCollapsed}
        label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      />
    </div>
  );
}
