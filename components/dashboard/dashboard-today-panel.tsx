import Link from "next/link";
import { Plus } from "lucide-react";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { CATEGORY_META, type CalendarCategory } from "@/lib/calendar/categories";
import { Card } from "@/components/retroui/Card";
import { buttonVariants } from "@/components/retroui/Button";
import { dashboardPanelCardClass } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

type DashboardTodayPanelProps = {
  events: CalendarItemRecord[];
  timezone: string;
};

function formatEventTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DashboardTodayPanel({ events, timezone }: DashboardTodayPanelProps) {
  return (
    <Card className={cn(dashboardPanelCardClass, "min-h-[17rem] p-4")}>
      <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
        <h2 className="font-head text-sm font-semibold uppercase tracking-wide">
          Today
        </h2>
        <Link
          href="/calendar"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex shrink-0 items-center gap-1",
          )}
        >
          <Plus className="size-3.5" aria-hidden />
          Add
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            No events scheduled for today.
          </p>
          <Link
            href="/calendar"
            className="font-sans text-sm font-medium underline underline-offset-2"
          >
            Open calendar
          </Link>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {events.map((event) => {
            const meta =
              CATEGORY_META[event.category as CalendarCategory] ??
              CATEGORY_META.meetings;
            return (
              <li
                key={event.occurrenceKey}
                className="flex items-start gap-3 border-2 border-border bg-background p-2 shadow-sm"
              >
                <span className="w-14 shrink-0 font-sans text-xs tabular-nums text-muted-foreground">
                  {event.scheduledAt
                    ? formatEventTime(event.scheduledAt, timezone)
                    : "—"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm font-medium">
                    {event.isPrivate ? "Busy" : event.title}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block border px-1.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wide",
                      meta.bgClass,
                      meta.borderClass,
                      meta.textClass,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
