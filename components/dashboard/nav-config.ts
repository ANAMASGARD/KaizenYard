import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Calendar,
  Kanban,
  LayoutDashboard,
  LayoutTemplate,
  NotebookPen,
  PenTool,
  Settings,
  Shapes,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

export type GeneratedNavItem = {
  href: string;
  label: string;
  iconName: string;
  color: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const GENERATED_APPS_GROUP_LABEL = "AI Generated Apps";

export function generatedAppHref(appId: number): string {
  return `/templates/app/${appId}`;
}

export function isGeneratedAppPathname(pathname: string): boolean {
  return /^\/templates\/app\/\d+/.test(pathname);
}

export const DASHBOARD_NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        iconClassName: "text-blue-600",
      },
      {
        href: "/assistant",
        label: "AI Assistant",
        icon: Bot,
        iconClassName: "text-violet-600",
      },
    ],
  },
  {
    label: "Productivity",
    items: [
      {
        href: "/calendar",
        label: "Calendar",
        icon: Calendar,
        iconClassName: "text-red-600",
      },
      {
        href: "/tasks",
        label: "Tasks / Kanban",
        icon: Kanban,
        iconClassName: "text-emerald-600",
      },
      {
        href: "/notes",
        label: "Notes",
        icon: NotebookPen,
        iconClassName: "text-amber-600",
      },
    ],
  },
  {
    label: "Create",
    items: [
      {
        href: "/whiteboard",
        label: "Whiteboard",
        icon: PenTool,
        iconClassName: "text-pink-600",
      },
      {
        href: "/pages",
        label: "Pages / Spaces",
        icon: Shapes,
        iconClassName: "text-cyan-600",
      },
      {
        href: "/templates",
        label: "AI Template Builder",
        icon: LayoutTemplate,
        iconClassName: "text-orange-600",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        iconClassName: "text-slate-600",
      },
    ],
  },
];

export const DASHBOARD_NAV_ITEMS: NavItem[] = DASHBOARD_NAV_GROUPS.flatMap(
  (group) => group.items,
);

export function getNavItemByPathname(
  pathname: string,
  generatedApps?: GeneratedNavItem[],
): NavItem | undefined {
  if (isGeneratedAppPathname(pathname) && generatedApps) {
    const match = generatedApps.find((app) => app.href === pathname);
    if (match) {
      return {
        href: match.href,
        label: match.label,
        icon: LayoutTemplate,
        iconClassName: "",
      };
    }
  }

  return DASHBOARD_NAV_ITEMS.find((item) => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
}
