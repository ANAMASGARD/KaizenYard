"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Tabs } from "@/components/retroui/Tab";
import { CategoryDialog } from "@/components/settings/category-dialog";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import {
  createUserCategory,
  deleteUserCategory,
  reorderUserCategories,
  updateUserCategory,
} from "@/lib/settings/categories-actions";
import { categoryToMeta } from "@/lib/settings/category-resolver";
import { getCategoryIcon } from "@/lib/settings/category-icons";
import { useUserCategories } from "@/lib/settings/use-user-categories";
import type { CategoryModule, UserCategoryRecord } from "@/lib/settings/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODULE_TABS: { id: CategoryModule; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "kanban", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "reminder", label: "Reminders" },
];

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: UserCategoryRecord;
  onEdit: (category: UserCategoryRecord) => void;
  onDelete: (category: UserCategoryRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  const meta = categoryToMeta(category);
  const Icon = getCategoryIcon(category.icon);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded border-2 border-border bg-card px-3 py-2 shadow-sm",
        isDragging && "opacity-70",
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded border-2",
          meta.bgClass,
          meta.borderClass,
          meta.textClass,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-head text-sm">{category.name}</p>
        <p className="font-sans text-xs text-muted-foreground">{category.key}</p>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 shadow-none"
          onClick={() => onEdit(category)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-8 shadow-none"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CategoryModulePanel({ module }: { module: CategoryModule }) {
  const { categories, loading, refresh } = useUserCategories(module);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserCategoryRecord | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const ordered = arrayMove(categories, oldIndex, newIndex);
    try {
      await reorderUserCategories(
        module,
        ordered.map((c) => c.id),
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reorder failed");
    }
  }

  if (loading) {
    return <div className="h-24 animate-pulse rounded bg-muted/40" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add category
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {categories.map((category) => (
              <SortableCategoryRow
                key={category.id}
                category={category}
                onEdit={(row) => {
                  setEditing(row);
                  setDialogOpen(true);
                }}
                onDelete={async (row) => {
                  try {
                    await deleteUserCategory(row.id);
                    await refresh();
                    toast.success("Category deleted");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Delete failed");
                  }
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={module}
        initial={editing}
        onSubmit={async (values) => {
          if (editing) {
            await updateUserCategory(editing.id, values);
          } else {
            await createUserCategory({ module, ...values });
          }
          await refresh();
          toast.success(editing ? "Category updated" : "Category created");
        }}
      />
    </div>
  );
}

export function CategoriesSection() {
  const [activeModule, setActiveModule] = useState<CategoryModule>("calendar");

  return (
    <SettingsSectionCard
      title="Categories"
      description="Customize labels for calendar events, tasks, notes, and reminders."
    >
      <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as CategoryModule)}>
        <Tabs.List className="mb-4 flex-wrap gap-2">
          {MODULE_TABS.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {MODULE_TABS.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            <CategoryModulePanel module={tab.id} />
          </Tabs.Content>
        ))}
      </Tabs>
    </SettingsSectionCard>
  );
}
