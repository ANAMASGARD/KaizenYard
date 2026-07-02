"use client";

import { useEffect, useState } from "react";
import type { PageTemplate } from "@/lib/pages/types";
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

type PageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceName?: string;
  onSubmit: (values: { title: string; template: PageTemplate }) => Promise<void>;
};

export function PageDialog({
  open,
  onOpenChange,
  spaceName,
  onSubmit,
}: PageDialogProps) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<PageTemplate>("blank");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setTemplate("blank");
    setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim() || "Untitled", template });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">Create New Page</h2>
        </Dialog.Header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 pb-4">
          <Dialog.Description>
            {spaceName
              ? `Add a page to ${spaceName}.`
              : "Add a new page to this space."}
          </Dialog.Description>

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
              Template
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
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create Page"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
