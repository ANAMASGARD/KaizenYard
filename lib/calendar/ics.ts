import type { CalendarItemRecord } from "@/lib/calendar/types";

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function serializeCalendarToIcs(items: CalendarItemRecord[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kaizenyard//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const item of items) {
    if (!item.scheduledAt) continue;
    const start = new Date(item.scheduledAt);
    const end = new Date(start.getTime() + item.durationMin * 60_000);
    const uid = `kaizenyard-${item.occurrenceKey}@calendar`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);

    if (item.isPrivate) {
      lines.push("SUMMARY:Busy");
      lines.push("CLASS:PRIVATE");
    } else {
      lines.push(`SUMMARY:${escapeIcs(item.title)}`);
      if (item.description) {
        lines.push(`DESCRIPTION:${escapeIcs(item.description)}`);
      }
      if (item.location) {
        lines.push(`LOCATION:${escapeIcs(item.location)}`);
      }
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
