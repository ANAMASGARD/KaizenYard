import type { ReactNode } from "react";
import Link from "next/link";
import type {
  DashboardAssistantPreview,
  DashboardNotePreview,
  DashboardTaskPreview,
} from "@/lib/dashboard/types";
import { formatRelativeTime } from "@/lib/notes/date-utils";
import { Card } from "@/components/retroui/Card";
import { Badge } from "@/components/retroui/Badge";
import {
  dashboardPanelCardClass,
  dashboardTripleGridClass,
} from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

type DashboardActivityPanelProps = {
  recentNotes: DashboardNotePreview[];
  upcomingTasks: DashboardTaskPreview[];
  recentAssistantSessions: DashboardAssistantPreview[];
};

function EmptyState({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <p className="font-sans text-xs text-muted-foreground">{message}</p>
      <Link
        href={href}
        className="mt-1 inline-block font-sans text-xs font-medium underline underline-offset-2"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ActivityCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn(dashboardPanelCardClass, "min-h-[14rem] p-4")}>
      <h2 className="mb-3 shrink-0 font-head text-sm font-semibold uppercase tracking-wide">
        {title}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  );
}

export function DashboardActivityPanel({
  recentNotes,
  upcomingTasks,
  recentAssistantSessions,
}: DashboardActivityPanelProps) {
  return (
    <div className={dashboardTripleGridClass}>
      <ActivityCard title="Recent notes">
        {recentNotes.length === 0 ? (
          <EmptyState message="No notes yet." href="/notes" linkLabel="Create a note" />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href="/notes"
                  className="block border-2 border-border bg-background p-2 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <p className="truncate font-sans text-sm font-medium">{note.title}</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {formatRelativeTime(note.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ActivityCard>

      <ActivityCard title="Upcoming tasks">
        {upcomingTasks.length === 0 ? (
          <EmptyState message="No due tasks this week." href="/tasks" linkLabel="Open kanban" />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcomingTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href="/tasks"
                  className="flex items-center justify-between gap-2 border-2 border-border bg-background p-2 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <p className="min-w-0 truncate font-sans text-sm font-medium">{task.title}</p>
                  <Badge
                    className={cn(
                      "shrink-0 font-sans text-[10px]",
                      task.isOverdue && "border-destructive bg-destructive/10 text-destructive",
                    )}
                  >
                    {task.isOverdue ? "Overdue" : formatDueDate(task.dueDate)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ActivityCard>

      <ActivityCard title="Assistant">
        {recentAssistantSessions.length === 0 ? (
          <EmptyState
            message="No chats yet."
            href="/assistant"
            linkLabel="Start Kaizen Witness"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentAssistantSessions.map((session) => (
              <li key={session.id}>
                <Link
                  href="/assistant"
                  className="block border-2 border-border bg-background p-2 shadow-sm transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-sans text-sm font-medium">
                      {session.title}
                    </p>
                    <Badge className="shrink-0 font-sans text-[10px] capitalize">
                      {session.privacyMode}
                    </Badge>
                  </div>
                  {session.lastMessageAt ? (
                    <p className="font-sans text-xs text-muted-foreground">
                      {formatRelativeTime(session.lastMessageAt)}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ActivityCard>
    </div>
  );
}
