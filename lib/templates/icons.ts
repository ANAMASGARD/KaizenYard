import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Calendar,
  CheckSquare,
  DollarSign,
  Flame,
  Heart,
  LayoutTemplate,
  ListTodo,
  PiggyBank,
  Target,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  BookOpen,
  Calendar,
  CheckSquare,
  DollarSign,
  Flame,
  Heart,
  LayoutTemplate,
  ListTodo,
  PiggyBank,
  Target,
  TrendingUp,
  UtensilsCrossed,
};

export const ALLOWED_ICON_NAMES = Object.keys(ICON_MAP);

export function resolveTemplateIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutTemplate;
}
