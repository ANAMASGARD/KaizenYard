"use client";

import { useState } from "react";
import {
  CALENDAR_ITEM_TYPES,
  type CalendarItemType,
} from "@/lib/calendar/categories";
import {
  combineDayAndMinutes,
  formatDayKey,
  parseDayKey,
} from "@/lib/calendar/date-utils";
import {
  createCalendarItem,
  deleteCalendarItem,
  updateCalendarItem,
} from "@/lib/calendar/actions";
import {
  buildRecurrenceRule,
  parseRecurrencePreset,
  RECURRENCE_END_TYPES,
  RECURRENCE_PRESETS,
} from "@/lib/calendar/recurrence";
import {
  estimateMeetingCostCents,
  formatCents,
} from "@/lib/calendar/focus-utils";
import type {
  CalendarItemRecord,
  CalendarSettingsRecord,
  EditScope,
  EventDialogDefaults,
  RecurrenceEndType,
  RecurrencePreset,
} from "@/lib/calendar/types";
import { CategorySwatchPicker } from "@/components/calendar/category-swatch-picker";
import { MeetingPulsePanel } from "@/components/calendar/meeting-pulse-panel";
import { ScopePrompt } from "@/components/calendar/scope-prompt";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";
import { Textarea } from "@/components/retroui/Textarea";

const fieldLabelClass =
  "font-head text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

type EventDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: EventDialogDefaults | null;
  settings: CalendarSettingsRecord | null;
  onSaved: (item: CalendarItemRecord) => void;
  onDeleted?: (occurrenceKey: string) => void;
};

type EventDialogFormProps = {
  defaults: EventDialogDefaults | null;
  editing?: CalendarItemRecord;
  settings: CalendarSettingsRecord | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: CalendarItemRecord) => void;
  onDeleted?: (occurrenceKey: string) => void;
};

function buildInitialFormState(
  defaults: EventDialogDefaults | null,
  editing?: CalendarItemRecord,
) {
  if (editing) {
    const scheduled = editing.scheduledAt ? new Date(editing.scheduledAt) : null;
    return {
      title: editing.title,
      description: editing.description ?? "",
      location: editing.location ?? "",
      itemType: editing.itemType,
      category: editing.category,
      durationMin: editing.durationMin,
      bufferBeforeMin: editing.bufferBeforeMin,
      bufferAfterMin: editing.bufferAfterMin,
      isPrivate: editing.isPrivate,
      attendeeCount: editing.attendeeCount,
      asDraft: !editing.scheduledAt,
      dateKey: scheduled ? formatDayKey(scheduled) : formatDayKey(new Date()),
      timeValue: scheduled
        ? `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`
        : "09:00",
      recurrencePreset: parseRecurrencePreset(editing.recurrenceRule),
      recurrenceEndType: "never" as RecurrenceEndType,
      recurrenceEndDate: formatDayKey(new Date()),
      recurrenceEndCount: 10,
    };
  }

  const dateKey = defaults?.dayKey ?? formatDayKey(new Date());
  let timeValue = "09:00";
  if (defaults?.slotMinutes !== undefined) {
    const h = Math.floor(defaults.slotMinutes / 60);
    const m = defaults.slotMinutes % 60;
    timeValue = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return {
    title: "",
    description: "",
    location: "",
    itemType: "task" as CalendarItemType,
    category: "meetings",
    durationMin: 60,
    bufferBeforeMin: 0,
    bufferAfterMin: 0,
    isPrivate: false,
    attendeeCount: 1,
    asDraft: !defaults?.dayKey,
    dateKey,
    timeValue,
    recurrencePreset: "none" as RecurrencePreset,
    recurrenceEndType: "never" as RecurrenceEndType,
    recurrenceEndDate: formatDayKey(new Date()),
    recurrenceEndCount: 10,
  };
}

function EventDialogForm({
  defaults,
  editing,
  settings,
  onOpenChange,
  onSaved,
  onDeleted,
}: EventDialogFormProps) {
  const initial = buildInitialFormState(defaults, editing);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [itemType, setItemType] = useState<CalendarItemType>(initial.itemType);
  const [category, setCategory] = useState<string>(initial.category);
  const [dateKey, setDateKey] = useState(initial.dateKey);
  const [timeValue, setTimeValue] = useState(initial.timeValue);
  const [durationMin, setDurationMin] = useState(initial.durationMin);
  const [bufferBeforeMin, setBufferBeforeMin] = useState(initial.bufferBeforeMin);
  const [bufferAfterMin, setBufferAfterMin] = useState(initial.bufferAfterMin);
  const [isPrivate, setIsPrivate] = useState(initial.isPrivate);
  const [attendeeCount, setAttendeeCount] = useState(initial.attendeeCount);
  const [asDraft, setAsDraft] = useState(initial.asDraft);
  const [recurrencePreset, setRecurrencePreset] = useState<RecurrencePreset>(
    initial.recurrencePreset,
  );
  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>(
    initial.recurrenceEndType,
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    initial.recurrenceEndDate,
  );
  const [recurrenceEndCount, setRecurrenceEndCount] = useState(
    initial.recurrenceEndCount,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopePrompt, setScopePrompt] = useState<"edit" | "delete" | null>(null);

  const selectedDate = defaults?.dayKey
    ? parseDayKey(defaults.dayKey).toLocaleDateString()
    : null;

  const costCents =
    settings && attendeeCount > 1
      ? estimateMeetingCostCents(
          durationMin,
          attendeeCount,
          settings.avgHourlyRateCents,
        )
      : 0;

  function buildScheduledAt(): string | null {
    if (asDraft) return null;
    const [h, m] = timeValue.split(":").map(Number);
    return combineDayAndMinutes(parseDayKey(dateKey), h * 60 + m).toISOString();
  }

  function buildRecurrence(): string | null {
    if (asDraft || recurrencePreset === "none") return null;
    const scheduledAt = buildScheduledAt();
    if (!scheduledAt) return null;
    return buildRecurrenceRule({
      preset: recurrencePreset,
      dtstart: new Date(scheduledAt),
      endType: recurrenceEndType,
      endDate:
        recurrenceEndType === "on_date"
          ? parseDayKey(recurrenceEndDate)
          : undefined,
      endCount:
        recurrenceEndType === "after_count" ? recurrenceEndCount : undefined,
    });
  }

  function buildPayload() {
    return {
      title,
      description: description.trim() || null,
      location: location.trim() || null,
      itemType,
      category,
      durationMin,
      bufferBeforeMin,
      bufferAfterMin,
      isPrivate,
      attendeeCount,
      scheduledAt: buildScheduledAt(),
      recurrenceRule: buildRecurrence(),
    };
  }

  const isRecurringEdit =
    editing?.isRecurringInstance || Boolean(editing?.recurrenceRule);

  async function submitWithScope(scope: EditScope) {
    setPending(true);
    setError(null);
    try {
      const payload = buildPayload();
      const saved = editing
        ? await updateCalendarItem(
            editing.id,
            payload,
            scope,
            editing.originalStartAt,
          )
        : await createCalendarItem(payload);
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editing && isRecurringEdit) {
      setScopePrompt("edit");
      return;
    }
    await submitWithScope("series");
  }

  async function handleDelete(scope: EditScope) {
    if (!editing) return;
    setPending(true);
    setError(null);
    try {
      await deleteCalendarItem(editing.occurrenceKey, scope);
      onDeleted?.(editing.occurrenceKey);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setPending(false);
      setScopePrompt(null);
    }
  }

  function requestDelete() {
    if (editing && isRecurringEdit) {
      setScopePrompt("delete");
      return;
    }
    void handleDelete("series");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
        {selectedDate && !editing && (
          <p className="font-sans text-xs text-muted-foreground">
            Selected date: {selectedDate}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="event-title" className={fieldLabelClass}>
            Title
          </label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team standup"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-description" className={fieldLabelClass}>
            Description
          </label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="Add helpful context"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-location" className={fieldLabelClass}>
            Location
          </label>
          <Input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Conference room A"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="event-time" className={fieldLabelClass}>
              Time
            </label>
            <Input
              id="event-time"
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              disabled={asDraft}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="event-type" className={fieldLabelClass}>
              Type
            </label>
            <select
              id="event-type"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as CalendarItemType)}
              className="w-full rounded border-2 border-border px-3 py-2 font-sans text-sm shadow-sm"
            >
              {CALENDAR_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "task" ? "Task" : "Reminder"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className={fieldLabelClass}>Category</span>
          <CategorySwatchPicker
            value={category}
            onChange={setCategory}
            module={itemType === "reminder" ? "reminder" : "calendar"}
          />
        </div>

        <label className="flex items-center gap-2 font-sans text-sm">
          <input
            type="checkbox"
            checked={asDraft}
            onChange={(e) => setAsDraft(e.target.checked)}
            className="size-4 border-2 border-border"
          />
          Save as draft (unscheduled)
        </label>

        {!asDraft && (
          <div className="space-y-1.5">
            <label htmlFor="event-date" className={fieldLabelClass}>
              Date
            </label>
            <Input
              id="event-date"
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              required={!asDraft}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="event-duration" className={fieldLabelClass}>
              Duration (min)
            </label>
            <Input
              id="event-duration"
              type="number"
              min={15}
              step={15}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="event-attendees" className={fieldLabelClass}>
              Attendees
            </label>
            <Input
              id="event-attendees"
              type="number"
              min={1}
              max={500}
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(Number(e.target.value))}
            />
          </div>
        </div>

        {costCents > 0 && (
          <p className="font-sans text-sm text-muted-foreground">
            Estimated meeting cost:{" "}
            <span className="font-semibold text-foreground">
              {formatCents(costCents)}
            </span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="buffer-before" className={fieldLabelClass}>
              Buffer before
            </label>
            <select
              id="buffer-before"
              value={bufferBeforeMin}
              onChange={(e) => setBufferBeforeMin(Number(e.target.value))}
              className="w-full rounded border-2 border-border px-2 py-2 font-sans text-sm"
            >
              {BUFFER_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="buffer-after" className={fieldLabelClass}>
              Buffer after
            </label>
            <select
              id="buffer-after"
              value={bufferAfterMin}
              onChange={(e) => setBufferAfterMin(Number(e.target.value))}
              className="w-full rounded border-2 border-border px-2 py-2 font-sans text-sm"
            >
              {BUFFER_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>

        {!asDraft && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="recurrence" className={fieldLabelClass}>
                Repeat
              </label>
              <select
                id="recurrence"
                value={recurrencePreset}
                onChange={(e) =>
                  setRecurrencePreset(e.target.value as RecurrencePreset)
                }
                className="w-full rounded border-2 border-border px-2 py-2 font-sans text-sm"
              >
                {RECURRENCE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {recurrencePreset !== "none" && (
              <div className="space-y-1.5">
                <label htmlFor="recurrence-end" className={fieldLabelClass}>
                  Ends
                </label>
                <select
                  id="recurrence-end"
                  value={recurrenceEndType}
                  onChange={(e) =>
                    setRecurrenceEndType(e.target.value as RecurrenceEndType)
                  }
                  className="w-full rounded border-2 border-border px-2 py-2 font-sans text-sm"
                >
                  {RECURRENCE_END_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {recurrencePreset !== "none" && recurrenceEndType === "on_date" && (
          <Input
            type="date"
            value={recurrenceEndDate}
            onChange={(e) => setRecurrenceEndDate(e.target.value)}
          />
        )}
        {recurrencePreset !== "none" && recurrenceEndType === "after_count" && (
          <Input
            type="number"
            min={1}
            max={365}
            value={recurrenceEndCount}
            onChange={(e) => setRecurrenceEndCount(Number(e.target.value))}
          />
        )}

        <label className="flex items-center gap-2 font-sans text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="size-4 border-2 border-border"
          />
          Private (hide details in exports)
        </label>

        {editing && (
          <MeetingPulsePanel
            calendarItemId={editing.id}
            hasRecurrence={Boolean(editing.recurrenceRule)}
          />
        )}

        {error && (
          <p className="font-sans text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {asDraft ? (
            <Button type="submit" size="sm" disabled={pending}>
              Save draft
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={pending}>
              {editing ? "Save changes" : "Schedule"}
            </Button>
          )}
          {editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={requestDelete}
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </form>

      <ScopePrompt
        open={scopePrompt !== null}
        action={scopePrompt ?? "edit"}
        onCancel={() => setScopePrompt(null)}
        onChoose={(scope) => {
          if (scopePrompt === "delete") {
            void handleDelete(scope);
          } else {
            void submitWithScope(scope);
            setScopePrompt(null);
          }
        }}
      />
    </>
  );
}

export function EventDialog({
  open,
  onOpenChange,
  defaults,
  settings,
  onSaved,
  onDeleted,
}: EventDialogProps) {
  const editing = defaults?.item;
  const formKey = editing
    ? `edit-${editing.occurrenceKey}`
    : `create-${defaults?.dayKey ?? ""}-${defaults?.slotMinutes ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-lg">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">
            {editing ? "Edit calendar item" : "Create calendar item"}
          </h2>
        </Dialog.Header>
        {open ? (
          <EventDialogForm
            key={formKey}
            defaults={defaults}
            editing={editing}
            settings={settings}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : null}
      </Dialog.Content>
    </Dialog>
  );
}
