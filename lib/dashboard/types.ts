import type { CalendarItemRecord } from "@/lib/calendar/types";
import type { PrivacyMode } from "@/lib/assistant/types";
import type { PinnedSidebarApp } from "@/lib/templates/types";

export type ProductivityOverview = {
  calendarItemCount: number;
  boardCount: number;
  taskCount: number;
  noteCount: number;
  whiteboardCount: number;
  spaceCount: number;
  pageCount: number;
  generatedAppCount: number;
};

export type DashboardFocusSnapshot = {
  weeklyFocusGoalHours: number;
  scheduledHours: number;
  focusRemainingHours: number;
  fragmentation: number;
  progressPercent: number;
};

export type DashboardNotePreview = {
  id: number;
  title: string;
  updatedAt: string;
};

export type DashboardTaskPreview = {
  id: number;
  title: string;
  dueDate: string;
  isOverdue: boolean;
};

export type DashboardAssistantPreview = {
  id: number;
  title: string;
  privacyMode: PrivacyMode;
  lastMessageAt: string | null;
};

export type DashboardWeb3Status = {
  network: string;
  networkLabel: string;
  vaultContractId: string | null;
  witnessContractId: string | null;
  vaultSpaceCount: number;
};

export type DashboardSnapshot = {
  userName: string;
  timezone: string;
  todayLabel: string;
  overview: ProductivityOverview;
  todayEvents: CalendarItemRecord[];
  focus: DashboardFocusSnapshot | null;
  recentNotes: DashboardNotePreview[];
  upcomingTasks: DashboardTaskPreview[];
  recentAssistantSessions: DashboardAssistantPreview[];
  pinnedApps: PinnedSidebarApp[];
  web3: DashboardWeb3Status;
};
