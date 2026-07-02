"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import { Text } from "@/components/retroui/Text";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getSettingsNavItem } from "@/lib/settings/nav-config";
import { usePathname } from "next/navigation";

type SettingsShellProps = {
  children: React.ReactNode;
};

export function SettingsShell({ children }: SettingsShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeItem = getSettingsNavItem(pathname);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Text as="h1">Settings</Text>
        <p className="font-sans text-sm text-muted-foreground">
          Manage your account, preferences, categories, and AI settings in one place.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-full shrink-0 lg:block lg:w-64">
          <div className="sticky top-24 rounded border-2 border-border bg-card p-3 shadow-md">
            <SettingsNav />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} swipeDirection="left">
              <Drawer.Trigger
                render={
                  <Button type="button" variant="outline" size="sm" className="gap-2" />
                }
              >
                <Menu className="size-4" />
                {activeItem?.label ?? "Sections"}
              </Drawer.Trigger>
              <Drawer.Content className="inset-y-0 top-0 left-0 right-auto mt-0 h-full max-h-screen w-[min(20rem,85vw)] max-w-none rounded-none border-r-2 border-t-0 p-0">
                <Drawer.Header className="border-b-2 border-border p-4">
                  <Drawer.Title>Settings</Drawer.Title>
                </Drawer.Header>
                <div className="p-4">
                  <SettingsNav onNavigate={() => setDrawerOpen(false)} />
                </div>
              </Drawer.Content>
            </Drawer>
            {activeItem ? (
              <span className="font-head text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {activeItem.label}
              </span>
            ) : null}
          </div>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
