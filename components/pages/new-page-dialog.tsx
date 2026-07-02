"use client";

import { useState } from "react";
import type { PageTemplate, SpaceListItem } from "@/lib/pages/types";
import { PAGE_TEMPLATE_LABELS } from "@/lib/pages/mappers";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

const TEMPLATES: PageTemplate[] = [
  "blank",
  "project_plan",
  "meeting_notes",
  "prd",
  "research_notes",
  "task_plan",
];

type NewPageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces?: SpaceListItem[];
  defaultSpaceId?: number;
  spaceName?: string;
  onSubmit: (values: {
    title: string;
    template: PageTemplate;
    spaceId: number;
  }) => Promise<void>;
};

export function NewPageDialog({
  open,
  onOpenChange,
  spaces,
  defaultSpaceId,
  spaceName,
  onSubmit,
}: NewPageDialogProps) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<PageTemplate>("blank");
  const [spaceId, setSpaceId] = useState<number>(
    defaultSpaceId ?? spaces?.[0]?.id ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setTitle("");
      setTemplate("blank");
      setSpaceId(defaultSpaceId ?? spaces?.[0]?.id ?? 0);
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!spaceId) {
      setError("Choose a space first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim() || "Untitled",
        template,
        spaceId,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSpaceName =
    spaceName ??
    spaces?.find((space) => space.id === spaceId)?.name ??
    "this space";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">Create New Page</h2>
        </Dialog.Header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 pb-4">
          <Dialog.Description>
            Add a page to {selectedSpaceName}.
          </Dialog.Description>

          {spaces && spaces.length > 0 && !defaultSpaceId ? (
            <div>
              <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Space
              </label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(Number(e.target.value))}
                className="h-10 w-full rounded border-2 border-border bg-background px-3 font-sans text-sm shadow-sm"
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Page Name
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Type
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as PageTemplate)}
              className="h-10 w-full rounded border-2 border-border bg-background px-3 font-sans text-sm shadow-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {PAGE_TEMPLATE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          {error ? (
            <p className="font-sans text-sm text-destructive">{error}</p>
          ) : null}

          <Dialog.Footer className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !spaceId}>
              {submitting ? "Creating…" : "Create Page"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
