import {
  Bell,
  BookOpen,
  Briefcase,
  Bug,
  Calendar,
  FileText,
  Heart,
  Kanban,
  Lightbulb,
  Megaphone,
  Monitor,
  Palette,
  Server,
  Tag,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS = [
  "tag",
  "users",
  "palette",
  "briefcase",
  "calendar",
  "megaphone",
  "user",
  "kanban",
  "monitor",
  "server",
  "bug",
  "file-text",
  "lightbulb",
  "book-open",
  "heart",
  "bell",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number];

const ICON_MAP: Record<string, LucideIcon> = {
  tag: Tag,
  users: Users,
  palette: Palette,
  briefcase: Briefcase,
  calendar: Calendar,
  megaphone: Megaphone,
  user: User,
  kanban: Kanban,
  monitor: Monitor,
  server: Server,
  bug: Bug,
  "file-text": FileText,
  lightbulb: Lightbulb,
  "book-open": BookOpen,
  heart: Heart,
  bell: Bell,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Tag;
}

export function isCategoryIconName(value: string): value is CategoryIconName {
  return (CATEGORY_ICON_OPTIONS as readonly string[]).includes(value);
}
