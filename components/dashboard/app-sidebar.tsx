"use client";

import { SidebarHeader } from "@/components/dashboard/sidebar-header";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarProfile } from "@/components/dashboard/sidebar-profile";
import { SidebarSearch } from "@/components/dashboard/sidebar-search";
import { collapsedSidebarWidth } from "@/components/dashboard/sidebar-rail";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { cn } from "@/lib/utils";

function SidebarPanel({
  className,
  forceExpanded = false,
  onNavigate,
}: {
  className?: string;
  forceExpanded?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col overflow-hidden border-black bg-sidebar",
        className,
      )}
      data-force-expanded={forceExpanded || undefined}
    >
      <SidebarHeader forceExpanded={forceExpanded} />
      <SidebarSearch forceExpanded={forceExpanded} />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav onNavigate={onNavigate} forceExpanded={forceExpanded} />
      </div>
      <SidebarProfile forceExpanded={forceExpanded} />
    </aside>
  );
}

export function AppSidebar() {
  const { collapsed } = useSidebar();

  return (
    <SidebarPanel
      className={cn(
        "hidden shrink-0 border-r-2 shadow-md transition-[width] duration-200 lg:sticky lg:top-0 lg:flex",
        collapsed ? collapsedSidebarWidth : "w-60",
      )}
    />
  );
}

export { SidebarPanel };
