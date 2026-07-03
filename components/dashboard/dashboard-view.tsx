import {
  Bot,
  Calendar,
  Kanban,
  LayoutTemplate,
  NotebookPen,
  PenTool,
  Shapes,
} from "lucide-react";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import {
  currentHourInTimezone,
  greetingForHour,
} from "@/lib/dashboard/date-utils";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardTodayPanel } from "@/components/dashboard/dashboard-today-panel";
import { DashboardFocusPanel } from "@/components/dashboard/dashboard-focus-panel";
import { DashboardActivityPanel } from "@/components/dashboard/dashboard-activity-panel";
import { DashboardWeb3Strip } from "@/components/dashboard/dashboard-web3-strip";
import { DashboardPinnedApps } from "@/components/dashboard/dashboard-pinned-apps";
import { Text } from "@/components/retroui/Text";
import {
  dashboardOverviewGridClass,
  dashboardSplitGridClass,
} from "@/components/dashboard/dashboard-layout";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
};

const STAT_CARDS = [
  {
    key: "calendarItemCount" as const,
    label: "Calendar items",
    href: "/calendar",
    icon: Calendar,
    iconClassName: "text-red-600",
  },
  {
    key: "boardCount" as const,
    label: "Kanban boards",
    href: "/tasks",
    icon: Kanban,
    iconClassName: "text-emerald-600",
  },
  {
    key: "taskCount" as const,
    label: "Tasks",
    href: "/tasks",
    icon: Kanban,
    iconClassName: "text-emerald-600",
  },
  {
    key: "noteCount" as const,
    label: "Notes",
    href: "/notes",
    icon: NotebookPen,
    iconClassName: "text-amber-600",
  },
  {
    key: "whiteboardCount" as const,
    label: "Whiteboards",
    href: "/whiteboard",
    icon: PenTool,
    iconClassName: "text-pink-600",
  },
  {
    key: "spaceCount" as const,
    label: "Spaces",
    href: "/pages",
    icon: Shapes,
    iconClassName: "text-cyan-600",
  },
  {
    key: "pageCount" as const,
    label: "Pages",
    href: "/pages",
    icon: Shapes,
    iconClassName: "text-cyan-600",
  },
  {
    key: "generatedAppCount" as const,
    label: "AI apps",
    href: "/templates",
    icon: LayoutTemplate,
    iconClassName: "text-orange-600",
  },
] as const;

export function DashboardView({ snapshot }: DashboardViewProps) {
  const hour = currentHourInTimezone(snapshot.timezone);
  const greeting = greetingForHour(hour);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-3">
        <div>
          <p className="font-sans text-sm text-muted-foreground">{snapshot.todayLabel}</p>
          <Text as="h1" className="mt-1">
            {greeting}, {snapshot.userName}
          </Text>
          <p className="mt-2 max-w-2xl font-sans text-sm text-muted-foreground">
            Your privacy-first workspace — calendar, tasks, notes, vaults, and Kaizen Witness
            in one place.
          </p>
        </div>
        <DashboardQuickActions />
      </header>

      <section>
        <h2 className="mb-3 font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Overview
        </h2>
        <div className={dashboardOverviewGridClass}>
          {STAT_CARDS.map((card) => (
            <DashboardStatCard
              key={card.key}
              href={card.href}
              label={card.label}
              value={snapshot.overview[card.key]}
              icon={card.icon}
              iconClassName={card.iconClassName}
            />
          ))}
        </div>
      </section>

      <section className={dashboardSplitGridClass}>
        <DashboardTodayPanel events={snapshot.todayEvents} timezone={snapshot.timezone} />
        <DashboardFocusPanel focus={snapshot.focus} />
      </section>

      <section>
        <h2 className="mb-3 font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Activity
        </h2>
        <DashboardActivityPanel
          recentNotes={snapshot.recentNotes}
          upcomingTasks={snapshot.upcomingTasks}
          recentAssistantSessions={snapshot.recentAssistantSessions}
        />
      </section>

      <DashboardWeb3Strip web3={snapshot.web3} />

      <DashboardPinnedApps apps={snapshot.pinnedApps} />

      <section className="w-full border-2 border-border bg-muted/20 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Bot className="size-5 text-violet-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-head text-sm font-semibold">Kaizen Witness AI</p>
            <p className="font-sans text-xs text-muted-foreground">
              Privacy proxy agent with blind, witness, vault, and delegate modes.
            </p>
          </div>
          <a
            href="/assistant"
            className="font-head text-sm underline underline-offset-2"
          >
            Open assistant
          </a>
        </div>
      </section>
    </div>
  );
}
