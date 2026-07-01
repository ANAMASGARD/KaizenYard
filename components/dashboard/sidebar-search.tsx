"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  DASHBOARD_NAV_GROUPS,
  type NavItem,
} from "@/components/dashboard/nav-config";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { Button } from "@/components/retroui/Button";
import { Command } from "@/components/retroui/Command";
import { collapsedRailButton } from "@/components/dashboard/sidebar-rail";
import { cn } from "@/lib/utils";

function NavCommandItem({
  item,
  onSelect,
}: {
  item: NavItem;
  onSelect: (href: string) => void;
}) {
  const Icon = item.icon;

  return (
    <Command.Item
      value={`${item.label} ${item.href}`}
      onSelect={() => onSelect(item.href)}
    >
      <Icon className={cn("size-4", item.iconClassName)} />
      <span>{item.label}</span>
    </Command.Item>
  );
}

export function SidebarSearch({
  forceExpanded = false,
}: {
  forceExpanded?: boolean;
}) {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;
  const [open, setOpen] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div
        className={cn(
          "w-full shrink-0 pt-2",
          isCollapsed ? "flex justify-center px-1.5" : "px-2",
        )}
      >
        <Button
          type="button"
          variant={isCollapsed ? "ghost" : "outline"}
          size={isCollapsed ? "icon" : "sm"}
          className={cn(
            isCollapsed
              ? collapsedRailButton
              : "h-9 w-full justify-start gap-2 px-2.5 font-sans text-sm text-muted-foreground",
          )}
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <Search className="size-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Search…</span>
              <kbd className="hidden rounded border border-black/20 bg-muted px-1.5 py-0.5 font-sans text-[10px] sm:inline">
                ⌘K
              </kbd>
            </>
          )}
        </Button>
      </div>

      <Command.Dialog open={open} onOpenChange={setOpen}>
        <Command.Input placeholder="Jump to a page…" />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <Command.Group key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <NavCommandItem
                  key={item.href}
                  item={item}
                  onSelect={navigate}
                />
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
