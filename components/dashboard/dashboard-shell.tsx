"use client";

import { AppSidebar, SidebarPanel } from "@/components/dashboard/app-sidebar";
import { getNavItemByPathname } from "@/components/dashboard/nav-config";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { Drawer } from "@/components/retroui/Drawer";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import { NeoHamburgerButton } from "@/components/dashboard/neo-hamburger-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function MobileTopBar() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const current = getNavItemByPathname(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b-2 border-border bg-background px-4 lg:hidden">
      <NeoHamburgerButton onClick={() => setMobileOpen(true)} label="Open menu" />
      <p className="min-w-0 flex-1 truncate font-head text-sm font-semibold">
        {current?.label ?? "Kaizenyard"}
      </p>
      <ThemeToggle />
    </header>
  );
}

function MobileSidebarDrawer() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen} swipeDirection="left">
      <Drawer.Content className="inset-y-0 top-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(18rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-0">
        <SidebarPanel
          className="h-full w-full border-r-0"
          forceExpanded
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer.Content>
    </Drawer>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <MobileSidebarDrawer />
      <ThemeToggle className="fixed top-5 right-5 z-50 hidden lg:inline-flex" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className={cn("flex-1 overflow-auto p-4 sm:p-6 lg:p-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarProvider>
  );
}
