"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SETTINGS_NAV_ITEMS } from "@/lib/settings/nav-config";

type SettingsNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function SettingsNav({ onNavigate, className }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {SETTINGS_NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/settings/profile" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-start gap-3 rounded border-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-border bg-primary text-primary-foreground shadow-sm"
                : "border-transparent hover:border-border hover:bg-muted/30",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0",
                active ? "text-primary-foreground" : item.iconClassName,
              )}
            />
            <span className="min-w-0">
              <span className="block font-head text-xs uppercase tracking-wide">
                {item.label}
              </span>
              <span
                className={cn(
                  "block font-sans text-[11px] leading-snug",
                  active ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
