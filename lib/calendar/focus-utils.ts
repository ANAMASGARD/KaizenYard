import type { CalendarItemRecord, CalendarSettingsRecord } from "@/lib/calendar/types";

export function computeWeeklyScheduledHours(
  items: CalendarItemRecord[],
  weekStart: Date,
  weekEnd: Date,
): number {
  let totalMin = 0;
  for (const item of items) {
    if (!item.scheduledAt) continue;
    const start = new Date(item.scheduledAt);
    if (start < weekStart || start >= weekEnd) continue;
    totalMin += item.durationMin + item.bufferBeforeMin + item.bufferAfterMin;
  }
  return totalMin / 60;
}

export function computeFragmentationScore(
  items: CalendarItemRecord[],
  weekStart: Date,
  weekEnd: Date,
  _settings: CalendarSettingsRecord,
): number {
  const meetings = items
    .filter((i) => i.scheduledAt)
    .map((i) => {
      const start = new Date(i.scheduledAt!);
      const end = new Date(start.getTime() + i.durationMin * 60_000);
      return { start, end };
    })
    .filter((m) => m.start >= weekStart && m.start < weekEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let fragments = 0;
  for (let i = 0; i < meetings.length - 1; i += 1) {
    const gapMin =
      (meetings[i + 1].start.getTime() - meetings[i].end.getTime()) / 60_000;
    if (gapMin > 0 && gapMin < 15) fragments += 1;
  }
  return fragments;
}

export function estimateMeetingCostCents(
  durationMin: number,
  attendeeCount: number,
  avgHourlyRateCents: number,
): number {
  if (attendeeCount <= 1) return 0;
  return Math.round(
    (durationMin / 60) * attendeeCount * avgHourlyRateCents,
  );
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function hasBufferConflict(
  items: CalendarItemRecord[],
  candidateStart: Date,
  candidateDurationMin: number,
  candidateBufferBefore: number,
  candidateBufferAfter: number,
  excludeId?: number,
): boolean {
  const candStart =
    candidateStart.getTime() - candidateBufferBefore * 60_000;
  const candEnd =
    candidateStart.getTime() +
    candidateDurationMin * 60_000 +
    candidateBufferAfter * 60_000;

  for (const item of items) {
    if (!item.scheduledAt || item.id === excludeId) continue;
    const start =
      new Date(item.scheduledAt).getTime() - item.bufferBeforeMin * 60_000;
    const end =
      new Date(item.scheduledAt).getTime() +
      item.durationMin * 60_000 +
      item.bufferAfterMin * 60_000;
    if (candStart < end && candEnd > start) return true;
  }
  return false;
}
