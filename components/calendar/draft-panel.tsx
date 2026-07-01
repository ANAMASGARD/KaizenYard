"use client";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";
import { CATEGORY_META } from "@/lib/calendar/categories";
import type { CalendarItemRecord } from "@/lib/calendar/types";
import { DRAFT_DROP_ID, eventDragId } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

type DraftPanelProps = {
  drafts: CalendarItemRecord[];
  onCreateDraft: () => void;
  onEditItem: (item: CalendarItemRecord) => void;
};

function DraftCard({
  item,
  onEdit,
}: {
  item: CalendarItemRecord;
  onEdit: () => void;
}) {
  const meta = CATEGORY_META[item.category];
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: eventDragId(item.occurrenceKey),
      data: { type: "event", item },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded border-2 border-border border-l-4 p-2 shadow-sm",
        meta.bgClass,
        meta.borderClass,
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing"
        aria-label="Drag draft"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <p className={cn("truncate font-head text-sm font-semibold", meta.textClass)}>
          {item.title}
        </p>
        <p className="font-sans text-[10px] text-muted-foreground">
          ~ {item.durationMin} min · {meta.label}
        </p>
      </button>
    </div>
  );
}

export function DraftPanel({ drafts, onCreateDraft, onEditItem }: DraftPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DRAFT_DROP_ID });

  return (
    <Card className="flex h-full min-h-64 flex-col border-2 border-border lg:min-h-0 lg:w-72 lg:shrink-0 lg:border-l-2 lg:border-t-0">
      <div className="border-b-2 border-border px-3 py-3">
        <Text as="h2" className="text-base! font-semibold">
          Draft tasks
        </Text>
        <p className="mt-1 font-sans text-xs text-muted-foreground">
          Drag onto the calendar to schedule
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-3 transition-colors",
          isOver && "bg-accent/40",
        )}
      >
        {drafts.length === 0 ? (
          <p className="font-sans text-xs text-muted-foreground">
            No drafts yet. Create a task to stage it here.
          </p>
        ) : (
          drafts.map((item) => (
            <DraftCard key={item.id} item={item} onEdit={() => onEditItem(item)} />
          ))
        )}
      </div>

      <div className="border-t-2 border-border p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={onCreateDraft}
        >
          <Plus className="size-4" />
          <span className="ms-2">Create new task</span>
        </Button>
      </div>
    </Card>
  );
}
