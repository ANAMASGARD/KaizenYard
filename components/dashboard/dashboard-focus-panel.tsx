import Link from "next/link";
import type { DashboardFocusSnapshot } from "@/lib/dashboard/types";
import { Card } from "@/components/retroui/Card";
import { dashboardPanelCardClass } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

type DashboardFocusPanelProps = {
  focus: DashboardFocusSnapshot | null;
};

export function DashboardFocusPanel({ focus }: DashboardFocusPanelProps) {
  if (!focus) return null;

  return (
    <Card className={cn(dashboardPanelCardClass, "min-h-[17rem] p-4")}>
      <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
        <h2 className="font-head text-sm font-semibold uppercase tracking-wide">
          Focus this week
        </h2>
        <Link
          href="/settings/calendar"
          className="shrink-0 font-sans text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Settings
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div>
          <div className="mb-1 flex justify-between font-sans text-xs text-muted-foreground">
            <span>Scheduled</span>
            <span>
              {focus.scheduledHours.toFixed(1)}h / {focus.weeklyFocusGoalHours}h goal
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded border-2 border-border bg-background">
            <div
              className={cn(
                "h-full transition-all",
                focus.progressPercent > 80 ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${focus.progressPercent}%` }}
            />
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {focus.focusRemainingHours.toFixed(1)}h focus time remaining
          </p>
        </div>

        <div className="mt-auto border-t-2 border-border pt-3">
          <p className="font-head text-[10px] uppercase tracking-wide text-muted-foreground">
            Fragmentation
          </p>
          <p className="font-sans text-sm font-semibold">
            {focus.fragmentation} tight gap{focus.fragmentation === 1 ? "" : "s"} (&lt;15 min)
          </p>
        </div>
      </div>
    </Card>
  );
}
