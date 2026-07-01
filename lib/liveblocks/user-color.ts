import { COLOR_META, KANBAN_COLORS } from "@/lib/kanban/colors";

const USER_COLOR_HEX: Record<(typeof KANBAN_COLORS)[number], string> = {
  blue: "#2563eb",
  yellow: "#eab308",
  green: "#059669",
  purple: "#7c3aed",
  pink: "#db2777",
  orange: "#ea580c",
  cyan: "#0891b2",
  emerald: "#0d9488",
};

export function colorForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const color = KANBAN_COLORS[Math.abs(hash) % KANBAN_COLORS.length];
  return USER_COLOR_HEX[color];
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function bgClassForUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const color = KANBAN_COLORS[Math.abs(hash) % KANBAN_COLORS.length];
  return COLOR_META[color].bgClass;
}
