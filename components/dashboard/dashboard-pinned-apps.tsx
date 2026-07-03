import Link from "next/link";
import type { PinnedSidebarApp } from "@/lib/templates/types";
import { generatedAppHref } from "@/components/dashboard/nav-config";
import { TemplateIcon } from "@/components/templates/template-icon";
import { Card } from "@/components/retroui/Card";
import { cn } from "@/lib/utils";

type DashboardPinnedAppsProps = {
  apps: PinnedSidebarApp[];
};

export function DashboardPinnedApps({ apps }: DashboardPinnedAppsProps) {
  if (apps.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Pinned AI apps
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        {apps.map((app) => (
          <Link
            key={app.id}
            href={generatedAppHref(app.id)}
            className="group flex h-full min-h-[5rem] w-full min-w-0"
          >
            <Card
              className={cn(
                "flex h-full w-full min-w-0 flex-row items-center gap-3 border-2 border-border p-3 shadow-md transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg",
              )}
            >
              <TemplateIcon
                name={app.icon}
                className="size-8 shrink-0"
                style={{ color: app.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-head text-sm font-semibold">{app.appName}</p>
                <p className="font-sans text-xs text-muted-foreground">Open app</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
