"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, LayoutTemplate, Pin, PinOff, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ShareAppDialog } from "@/components/templates/share-app-dialog";
import { TemplateIcon } from "@/components/templates/template-icon";
import { formatRelativeTime } from "@/lib/templates/format-relative-time";
import type { GeneratedAppListItem } from "@/lib/templates/types";
import { SIDEBAR_PIN_LIMIT } from "@/lib/templates/types";
import { notifyPinnedAppsChanged } from "@/lib/templates/pinned-apps-events";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Dialog } from "@/components/retroui/Dialog";
import { buttonVariants } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type GeneratedAppCardProps = {
  app: GeneratedAppListItem;
  pinnedCount: number;
  onPin: (id: number) => Promise<unknown>;
  onUnpin: (id: number) => Promise<unknown>;
  onDelete: (id: number) => Promise<void>;
};

export function GeneratedAppCard({
  app,
  pinnedCount,
  onPin,
  onUnpin,
  onDelete,
}: GeneratedAppCardProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handlePinToggle = async () => {
    setBusy(true);
    try {
      if (app.sidebarPinned) {
        await onUnpin(app.id);
        toast.success("Removed from sidebar");
      } else {
        if (pinnedCount >= SIDEBAR_PIN_LIMIT) {
          toast.warning(
            `You can pin at most ${SIDEBAR_PIN_LIMIT} generated apps to the sidebar.`,
          );
          return;
        }
        await onPin(app.id);
        toast.success("Added to sidebar");
      }
      notifyPinnedAppsChanged();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sidebar update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete(app.id);
      toast.success("App deleted");
      notifyPinnedAppsChanged();
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="flex h-full flex-col border-2 border-border p-4 shadow-md">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded border-2 border-border shadow-sm"
            style={{ backgroundColor: `${app.color}22` }}
          >
            <TemplateIcon
              name={app.icon}
              className="size-4"
              style={{ color: app.color }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-head text-base">{app.appName}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {app.description}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="inline-block size-3 rounded-full border border-border"
                style={{ backgroundColor: app.color }}
              />
              Created {formatRelativeTime(app.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/templates/app/${app.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Eye className="size-3.5" />
            Preview
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handlePinToggle()}
            disabled={busy}
          >
            {app.sidebarPinned ? (
              <>
                <PinOff className="size-3.5" />
                Remove from Sidebar
              </>
            ) : (
              <>
                <Pin className="size-3.5" />
                Add to Sidebar
              </>
            )}
          </Button>
          <ShareAppDialog
            app={app}
            trigger={
              <Button variant="outline" size="sm">
                <Share2 className="size-3.5" />
                Share
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={busy}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Content size="md" className="max-w-md">
          <Dialog.Header asChild>
            <h2 className="font-head text-lg">Delete {app.appName}?</h2>
          </Dialog.Header>
          <p className="text-sm text-muted-foreground">
            This removes the generated app and its saved state. This cannot be
            undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleDelete()} disabled={busy}>
              Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}

export function GeneratedAppsEmptyState() {
  return (
    <Card className="border-2 border-dashed border-border p-10 text-center shadow-md">
      <LayoutTemplate className="mx-auto size-10 text-muted-foreground" />
      <p className="mt-3 font-head text-sm uppercase tracking-[0.15em]">
        No apps yet
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate one with a prompt above.
      </p>
    </Card>
  );
}
