"use client";

import { SidebarHeader } from "@/components/dashboard/sidebar-header";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarProfile } from "@/components/dashboard/sidebar-profile";
import { SidebarSearch } from "@/components/dashboard/sidebar-search";
import { collapsedSidebarWidth } from "@/components/dashboard/sidebar-rail";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import type { GeneratedNavItem } from "@/components/dashboard/nav-config";
import { cn } from "@/lib/utils";

function SidebarPanel({
  className,
  forceExpanded = false,
  onNavigate,
  generatedApps = [],
}: {
  className?: string;
  forceExpanded?: boolean;
  onNavigate?: () => void;
  generatedApps?: GeneratedNavItem[];
}) {
  return (
    <aside
      className={cn(
        "flex h-screen flex-col overflow-hidden border-border bg-sidebar",
        className,
      )}
      data-force-expanded={forceExpanded || undefined}
    >
      <SidebarHeader forceExpanded={forceExpanded} />
      <SidebarSearch
        forceExpanded={forceExpanded}
        generatedApps={generatedApps}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav
          onNavigate={onNavigate}
          forceExpanded={forceExpanded}
          generatedApps={generatedApps}
        />
      </div>
      <SidebarProfile forceExpanded={forceExpanded} />
    </aside>
  );
}

export function AppSidebar({
  generatedApps = [],
}: {
  generatedApps?: GeneratedNavItem[];
}) {
  const { collapsed } = useSidebar();

  return (
    <SidebarPanel
      className={cn(
        "hidden shrink-0 border-r-2 shadow-md transition-[width] duration-200 lg:sticky lg:top-0 lg:flex",
        collapsed ? collapsedSidebarWidth : "w-60",
      )}
      generatedApps={generatedApps}
    />
  );
}

export { SidebarPanel };
