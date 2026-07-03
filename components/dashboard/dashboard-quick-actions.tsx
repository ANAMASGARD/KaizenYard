import Link from "next/link";
import { DASHBOARD_NAV_GROUPS } from "@/components/dashboard/nav-config";
import { buttonVariants } from "@/components/retroui/Button";
import { dashboardQuickActionsGridClass } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

const QUICK_ACTION_HREFS = new Set([
  "/assistant",
  "/calendar",
  "/tasks",
  "/notes",
  "/pages",
  "/templates",
]);

export function DashboardQuickActions() {
  const items = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items).filter((item) =>
    QUICK_ACTION_HREFS.has(item.href),
  );

  return (
    <div className={dashboardQuickActionsGridClass}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex h-9 w-full items-center justify-center gap-2 px-2",
            )}
          >
            <Icon className={cn("size-4 shrink-0", item.iconClassName)} aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
