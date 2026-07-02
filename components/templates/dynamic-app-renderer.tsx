"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import type {
  AppAction,
  AppSection,
  GeneratedAppDefinition,
} from "@/lib/templates/types";
import {
  mergeRuntimeWithSample,
  useAppRuntime,
} from "@/lib/templates/use-app-runtime";
import { ChecklistBlock } from "@/components/templates/blocks/checklist-block";
import { ChartPlaceholderBlock } from "@/components/templates/blocks/chart-placeholder-block";
import { FormBlock } from "@/components/templates/blocks/form-block";
import { ListBlock } from "@/components/templates/blocks/list-block";
import { ProgressBlock } from "@/components/templates/blocks/progress-block";
import { StatsBlock } from "@/components/templates/blocks/stats-block";
import { TableBlock } from "@/components/templates/blocks/table-block";
import { TagsBlock } from "@/components/templates/blocks/tags-block";
import { TextBlock } from "@/components/templates/blocks/text-block";
import { TemplateIcon } from "@/components/templates/template-icon";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type DynamicAppRendererProps = {
  definition: GeneratedAppDefinition;
  appId?: number;
  runtimeState?: Record<string, unknown>;
  interactive?: boolean;
  readOnly?: boolean;
  className?: string;
};

function getSectionColSpan(section: AppSection): string {
  switch (section.layout) {
    case "half":
      return "lg:col-span-6";
    case "third":
      return "lg:col-span-4";
    case "full":
    default:
      return "lg:col-span-12";
  }
}

function addHabitFromForm(
  definition: GeneratedAppDefinition,
  runtime: Record<string, unknown>,
): Record<string, unknown> {
  const formSection = definition.sections.find(
    (section): section is Extract<AppSection, { type: "form" }> =>
      section.type === "form",
  );
  const checklistSection = definition.sections.find(
    (section): section is Extract<AppSection, { type: "checklist" }> =>
      section.type === "checklist",
  );
  const listSection = definition.sections.find(
    (section): section is Extract<AppSection, { type: "list" }> => section.type === "list",
  );

  if (!formSection) {
    toast.warning("No habit form found.");
    return runtime;
  }

  const formRuntime = (runtime[formSection.id] as Record<string, string> | undefined) ?? {};
  const habitName =
    formRuntime["habit-name"] ??
    formRuntime["name"] ??
    formRuntime[formSection.fields[0]?.id ?? ""];

  if (!habitName?.trim()) {
    toast.warning("Enter a habit name first.");
    return runtime;
  }

  const nextRuntime = { ...runtime };

  if (checklistSection) {
    const checklistRuntime =
      (runtime[checklistSection.id] as { items?: Array<{ id: string; label: string; checked?: boolean }> } | undefined) ??
      {};
    const items = checklistRuntime.items ?? checklistSection.items;
    nextRuntime[checklistSection.id] = {
      items: [
        ...items,
        {
          id: `${checklistSection.id}-${Date.now()}`,
          label: habitName.trim(),
          checked: false,
        },
      ],
    };
  }

  if (listSection) {
    const listRuntime =
      (runtime[listSection.id] as {
        items?: Array<{ title: string; subtitle?: string; tag?: string }>;
      } | undefined) ?? {};
    const frequency = formRuntime["frequency"];
    const category = formRuntime["category"];
    nextRuntime[listSection.id] = {
      items: [
        ...(listRuntime.items ?? listSection.items),
        {
          title: habitName.trim(),
          subtitle: frequency ? `${frequency} habit` : "New habit",
          tag: category,
        },
      ],
    };
  }

  nextRuntime[formSection.id] = Object.fromEntries(
    formSection.fields.map((field) => [
      field.id,
      field.type === "select" ? field.options?.[0] ?? "" : "",
    ]),
  );

  toast.success("Habit added");
  return nextRuntime;
}

function renderSection(
  section: AppSection,
  runtime: Record<string, unknown>,
  onSectionChange: (sectionId: string, value: unknown) => void,
) {
  const sectionRuntime = runtime[section.id];

  switch (section.type) {
    case "stats":
      return <StatsBlock section={section} />;
    case "list":
      return <ListBlock section={section} />;
    case "table":
      return <TableBlock section={section} />;
    case "form":
      return (
        <FormBlock
          section={section}
          runtime={(sectionRuntime as Record<string, string>) ?? {}}
          onRuntimeChange={(value) => onSectionChange(section.id, value)}
        />
      );
    case "progress":
      return (
        <ProgressBlock
          section={section}
          runtime={(sectionRuntime as { value?: number; max?: number }) ?? {}}
          onRuntimeChange={(value) => onSectionChange(section.id, value)}
        />
      );
    case "checklist":
      return (
        <ChecklistBlock
          section={section}
          runtime={(sectionRuntime as { items?: typeof section.items }) ?? {}}
          onRuntimeChange={(value) => onSectionChange(section.id, value)}
        />
      );
    case "tags":
      return <TagsBlock section={section} />;
    case "chart":
      return <ChartPlaceholderBlock section={section} />;
    case "text":
      return <TextBlock section={section} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

function ActionBar({
  actions,
  onAction,
  readOnly = false,
}: {
  actions: AppAction[];
  onAction?: (action: AppAction) => void;
  readOnly?: boolean;
}) {
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t-2 border-border pt-4">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant ?? "default"}
          onClick={() => (onAction ? onAction(action) : toast.message(`${action.label} clicked`))}
          disabled={readOnly}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function PreviewAppBody({
  definition,
  initialState,
  readOnly = false,
}: {
  definition: GeneratedAppDefinition;
  initialState: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const [runtime, setRuntime] = useState(initialState);

  const onSectionChange = (sectionId: string, value: unknown) => {
    setRuntime((current) => ({ ...current, [sectionId]: value }));
  };

  const onAction = (action: AppAction) => {
    switch (action.id) {
      case "reset-day":
        setRuntime(initialState);
        toast.success("Day reset");
        return;
      case "add-habit":
        setRuntime((current) => addHabitFromForm(definition, current));
        return;
      case "save-progress":
        toast.success("Preview state saved locally");
        return;
      default:
        toast.message(`${action.label} clicked`);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {definition.sections.map((section) => (
          <div key={section.id} className={getSectionColSpan(section)}>
            {renderSection(section, runtime, onSectionChange)}
          </div>
        ))}
      </div>
      <ActionBar actions={definition.actions} onAction={onAction} readOnly={readOnly} />
    </>
  );
}

function PersistedAppBody({
  definition,
  appId,
  initialState,
  readOnly = false,
}: {
  definition: GeneratedAppDefinition;
  appId: number;
  initialState: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const { runtimeState, updateSectionState, replaceRuntimeState } = useAppRuntime({
    appId,
    initialState,
  });

  const onSectionChange = (sectionId: string, value: unknown) => {
    updateSectionState(sectionId, value);
  };

  const onAction = (action: AppAction) => {
    switch (action.id) {
      case "reset-day":
        replaceRuntimeState(initialState);
        toast.success("Day reset");
        return;
      case "add-habit":
        replaceRuntimeState(addHabitFromForm(definition, runtimeState));
        return;
      case "save-progress":
        toast.success("Progress saved");
        return;
      default:
        toast.message(`${action.label} clicked`);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {definition.sections.map((section) => (
          <div key={section.id} className={getSectionColSpan(section)}>
            {renderSection(section, runtimeState, onSectionChange)}
          </div>
        ))}
      </div>
      <ActionBar actions={definition.actions} onAction={onAction} readOnly={readOnly} />
    </>
  );
}

export function DynamicAppRenderer({
  definition,
  appId,
  runtimeState = {},
  interactive = false,
  readOnly = false,
  className,
}: DynamicAppRendererProps) {
  const initialState = mergeRuntimeWithSample(
    definition.sampleData,
    runtimeState,
  );
  const persisted = interactive && appId !== undefined;
  const previewKey = `${definition.appName}-${definition.sections.length}`;
  const accentBackground = useMemo(
    () => ({ backgroundColor: `${definition.color}22` }),
    [definition.color],
  );

  return (
    <div
      className={cn("space-y-4", className)}
      style={{ "--app-accent": definition.color } as CSSProperties}
    >
      <header className="rounded border-2 border-border bg-background p-4 shadow-md lg:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded border-2 border-border shadow-sm"
            style={accentBackground}
          >
            <TemplateIcon
              name={definition.icon}
              className="size-5"
              style={{ color: definition.color }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-head text-xl">{definition.appName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {definition.description}
            </p>
          </div>
        </div>
      </header>

      {persisted ? (
        <PersistedAppBody
          key={appId}
          definition={definition}
          appId={appId}
          initialState={initialState}
          readOnly={readOnly}
        />
      ) : (
        <PreviewAppBody
          key={previewKey}
          definition={definition}
          initialState={initialState}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
