"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Input } from "@/components/retroui/Input";

type RenameItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
};

export function RenameItemDialog({
  open,
  onOpenChange,
  title,
  label,
  initialName,
  onSubmit,
}: RenameItemDialogProps) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setError(null);
  }, [open, initialName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="sm:max-w-md">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">{title}</h2>
        </Dialog.Header>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 pb-4">
          <div>
            <label className="mb-1.5 block font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
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
              {submitting ? "Saving…" : "Save"}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
