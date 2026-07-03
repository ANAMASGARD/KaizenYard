/** Start/end of calendar day in an IANA timezone (for server-side "today" queries). */
export function getTimezoneDayRange(
  timezone: string,
  ref = new Date(),
): { start: Date; end: Date } {
  const ymd = ref.toLocaleDateString("en-CA", { timeZone: timezone });

  let start: Date | undefined;
  const searchStart = ref.getTime() - 36 * 3_600_000;
  const searchEnd = ref.getTime() + 36 * 3_600_000;

  for (let ms = searchStart; ms < searchEnd; ms += 3_600_000) {
    const d = new Date(ms);
    const day = d.toLocaleDateString("en-CA", { timeZone: timezone });
    const time = d.toLocaleTimeString("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (day === ymd && time === "00:00") {
      start = d;
      break;
    }
  }

  if (!start) {
    const fallback = new Date(ref);
    fallback.setUTCHours(0, 0, 0, 0);
    return { start: fallback, end: new Date(fallback.getTime() + 86_400_000) };
  }

  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function currentHourInTimezone(timezone: string, ref = new Date()): number {
  const hour = ref.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  return Number.parseInt(hour, 10);
}
