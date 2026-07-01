import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listCalendarItemsForExport } from "@/lib/calendar/actions";
import { serializeCalendarToIcs } from "@/lib/calendar/ics";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listCalendarItemsForExport();
  const ics = serializeCalendarToIcs(items);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kaizenyard-calendar.ics"',
    },
  });
}
