import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  Calendar,
  Database,
  Info,
  Link2,
  Palette,
  Shield,
  Tag,
  User,
} from "lucide-react";

export type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Avatar, timezone, language",
    icon: User,
    iconClassName: "text-blue-600",
  },
  {
    href: "/settings/preferences",
    label: "Preferences",
    description: "Theme, defaults, layout",
    icon: Palette,
    iconClassName: "text-violet-600",
  },
  {
    href: "/settings/categories",
    label: "Categories",
    description: "Calendar, tasks, notes, reminders",
    icon: Tag,
    iconClassName: "text-emerald-600",
  },
  {
    href: "/settings/ai",
    label: "AI Settings",
    description: "Model, tone, feature toggles",
    icon: Bot,
    iconClassName: "text-orange-600",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    description: "Email, reminders, alerts",
    icon: Bell,
    iconClassName: "text-amber-600",
  },
  {
    href: "/settings/calendar",
    label: "Calendar",
    description: "Focus goals, work hours",
    icon: Calendar,
    iconClassName: "text-red-600",
  },
  {
    href: "/settings/data",
    label: "Data & Export",
    description: "Download your data",
    icon: Database,
    iconClassName: "text-cyan-600",
  },
  {
    href: "/settings/privacy",
    label: "Privacy & Security",
    description: "Account security overview",
    icon: Shield,
    iconClassName: "text-slate-600",
  },
  {
    href: "/settings/integrations",
    label: "Integrations",
    description: "Connected apps",
    icon: Link2,
    iconClassName: "text-pink-600",
  },
  {
    href: "/settings/about",
    label: "About",
    description: "Version, help, legal",
    icon: Info,
    iconClassName: "text-slate-500",
  },
];

export function getSettingsNavItem(pathname: string): SettingsNavItem | undefined {
  return SETTINGS_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
