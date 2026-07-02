"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsClient } from "@/lib/use-is-client";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { CalendarEventChip } from "@/components/calendar/calendar-event-chip";
import { CategoryLegend } from "@/components/calendar/category-legend";
import { DraftPanel } from "@/components/calendar/draft-panel";
import { EventDialog } from "@/components/calendar/event-dialog";
import { FocusSummary } from "@/components/calendar/focus-summary";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import {
  combineDayAndMinutes,
  getMonthViewRange,
  getWeekViewRange,
  parseDayKey,
  slotIndexToMinutes,
} from "@/lib/calendar/date-utils";
import { hasBufferConflict } from "@/lib/calendar/focus-utils";
import {
  getCalendarSettings,
  listCalendarItems,
  scheduleCalendarItem,
  unscheduleCalendarItem,
} from "@/lib/calendar/actions";
import type {
  CalendarItemRecord,
  CalendarSettingsRecord,
  CalendarView,
  EventDialogDefaults,
} from "@/lib/calendar/types";
import {
  DRAFT_DROP_ID,
  parseEventDragId,
  parseMonthDayDropId,
  parseWeekSlotDropId,
} from "@/lib/calendar/types";

export function CalendarPage() {
  const [items, setItems] = useState<CalendarItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalendarView>("month");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [settings, setSettings] = useState<CalendarSettingsRecord | null>(null);
  const isClient = useIsClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaults, setDialogDefaults] =
    useState<EventDialogDefaults | null>(null);
  const [activeDragItem, setActiveDragItem] =
    useState<CalendarItemRecord | null>(null);
  const itemsSnapshotRef = useRef<CalendarItemRecord[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchItemsFor = useCallback((date: Date, currentView: CalendarView) => {
    const r =
      currentView === "month"
        ? getMonthViewRange(date)
        : getWeekViewRange(date);
    return listCalendarItems(
      r.start.toISOString(),
      r.end.toISOString(),
    ).then(setItems);
  }, []);

  const refreshItems = useCallback(() => {
    return fetchItemsFor(cursorDate, view);
  }, [cursorDate, fetchItemsFor, view]);

  const loadSettings = useCallback(() => {
    void getCalendarSettings().then(setSettings);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchItemsFor(cursorDate, view),
      getCalendarSettings(),
    ]).then(([, s]) => {
      if (!cancelled) {
        setSettings(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        dialogOpen
      ) {
        return;
      }
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        openCreate({});
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const drafts = items.filter((i) => !i.scheduledAt);
  const scheduled = items.filter((i) => i.scheduledAt);

  function openCreate(defaults: EventDialogDefaults) {
    setDialogDefaults(defaults);
    setDialogOpen(true);
  }

  function openEdit(item: CalendarItemRecord) {
    setDialogDefaults({ item });
    setDialogOpen(true);
  }

  function showUndo(message: string, snapshot: CalendarItemRecord[]) {
    toast(message, {
      action: {
        label: "Undo",
        onClick: () => setItems(snapshot),
      },
    });
  }

  function upsertItem(saved: CalendarItemRecord) {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.occurrenceKey === saved.occurrenceKey || i.id === saved.id,
      );
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    void refreshItems();
  }

  function removeItem(occurrenceKey: string) {
    const snapshot = [...items];
    setItems((prev) => prev.filter((i) => i.occurrenceKey !== occurrenceKey));
    showUndo("Item deleted", snapshot);
    void refreshItems();
  }

  function warnNoMeetingDay(day: Date) {
    if (!settings) return;
    const weekday = day.getDay();
    if (settings.noMeetingWeekdays.includes(weekday)) {
      toast.warning("This is a no-meeting day — scheduling anyway.");
    }
  }

  function warnBufferConflict(
    start: Date,
    item: CalendarItemRecord,
  ) {
    if (
      hasBufferConflict(
        scheduled,
        start,
        item.durationMin,
        item.bufferBeforeMin,
        item.bufferAfterMin,
        item.id,
      )
    ) {
      toast.warning("Back-to-back scheduling — buffer time may be tight.");
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragItem(null);
    const occurrenceKey = parseEventDragId(String(event.active.id));
    if (!occurrenceKey) return;

    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const existing = items.find((i) => i.occurrenceKey === occurrenceKey);
    if (!existing) return;

    itemsSnapshotRef.current = [...items];

    try {
      if (overId === DRAFT_DROP_ID) {
        const saved = await unscheduleCalendarItem(occurrenceKey);
        setItems((prev) =>
          prev.map((i) =>
            i.occurrenceKey === occurrenceKey ? saved : i,
          ),
        );
        showUndo("Moved to drafts", itemsSnapshotRef.current);
        void refreshItems();
        return;
      }

      const monthDay = parseMonthDayDropId(overId);
      if (monthDay) {
        const day = parseDayKey(monthDay);
        warnNoMeetingDay(day);
        let minutes = 9 * 60;
        if (existing.scheduledAt) {
          const prev = new Date(existing.scheduledAt);
          minutes = prev.getHours() * 60 + prev.getMinutes();
        }
        const scheduledAt = combineDayAndMinutes(day, minutes);
        warnBufferConflict(scheduledAt, existing);
        const saved = await scheduleCalendarItem(
          occurrenceKey,
          scheduledAt.toISOString(),
        );
        upsertItem(saved);
        return;
      }

      const weekSlot = parseWeekSlotDropId(overId);
      if (weekSlot) {
        const day = parseDayKey(weekSlot.dayKey);
        warnNoMeetingDay(day);
        const minutes = slotIndexToMinutes(weekSlot.slotIndex);
        const scheduledAt = combineDayAndMinutes(day, minutes);
        warnBufferConflict(scheduledAt, existing);
        const saved = await scheduleCalendarItem(
          occurrenceKey,
          scheduledAt.toISOString(),
        );
        upsertItem(saved);
      }
    } catch {
      setItems(itemsSnapshotRef.current);
      void refreshItems();
    }
  }

  if (loading) {
    return (
      <KaizenLoadingScreen
        label="Loading calendar"
        className="h-[calc(100vh-4rem)] min-h-[32rem] lg:h-[calc(100vh-2rem)]"
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[32rem] flex-col overflow-hidden lg:h-[calc(100vh-2rem)]">
      <CalendarToolbar
        view={view}
        cursorDate={cursorDate}
        onViewChange={(nextView) => {
          setView(nextView);
          void fetchItemsFor(cursorDate, nextView);
        }}
        onCursorDateChange={(date) => {
          setCursorDate(date);
          void fetchItemsFor(date, view);
        }}
        onToday={() => {
          const today = new Date();
          setCursorDate(today);
          void fetchItemsFor(today, view);
        }}
        onNewTask={() => openCreate({})}
        onSettingsChange={loadSettings}
      />

      <FocusSummary
        items={scheduled}
        cursorDate={cursorDate}
        settings={settings}
      />

      <DndContext
        sensors={sensors}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              return `Picked up ${String(active.id)}`;
            },
            onDragOver({ over }) {
              return over ? `Over ${String(over.id)}` : "";
            },
            onDragEnd({ active, over }) {
              return over
                ? `Dropped ${String(active.id)} on ${String(over.id)}`
                : `Cancelled dragging ${String(active.id)}`;
            },
            onDragCancel({ active }) {
              return `Cancelled dragging ${String(active.id)}`;
            },
          },
        }}
        onDragStart={(e) => {
          const key = parseEventDragId(String(e.active.id));
          if (!key) return;
          const item = items.find((i) => i.occurrenceKey === key) ?? null;
          setActiveDragItem(item);
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragItem(null)}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {view === "month" ? (
              <MonthView
                cursorDate={cursorDate}
                items={scheduled}
                isClient={isClient}
                onDayClick={(dayKey) => {
                  warnNoMeetingDay(parseDayKey(dayKey));
                  openCreate({ dayKey });
                }}
                onEditItem={openEdit}
              />
            ) : (
              <WeekView
                cursorDate={cursorDate}
                items={scheduled}
                isClient={isClient}
                onSlotClick={(dayKey, slotMinutes) => {
                  warnNoMeetingDay(parseDayKey(dayKey));
                  openCreate({ dayKey, slotMinutes });
                }}
                onEditItem={openEdit}
              />
            )}
          </div>

          <DraftPanel
            drafts={drafts}
            onCreateDraft={() => openCreate({})}
            onEditItem={openEdit}
          />
        </div>

        <DragOverlay>
          {activeDragItem ? (
            <CalendarEventChip item={activeDragItem} showDragHandle={false} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CategoryLegend />

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaults={dialogDefaults}
        settings={settings}
        onSaved={upsertItem}
        onDeleted={removeItem}
      />
    </div>
  );
}

/** @deprecated Use `CalendarPage` */
export const CalendarPageClient = CalendarPage;
