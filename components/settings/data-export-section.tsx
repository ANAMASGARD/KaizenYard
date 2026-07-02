"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { SettingsSectionCard } from "@/components/settings/settings-section-card";
import { toast } from "sonner";

export function DataExportSection() {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kaizenyard-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Data & Export"
        description="Download a JSON backup of your Kaizenyard data."
      >
        <p className="font-sans text-sm text-muted-foreground">
          Includes notes, tasks, calendar events, whiteboards, spaces, generated apps,
          categories, and settings. File attachments export metadata only (not file bytes).
        </p>
        <Button
          type="button"
          variant="default"
          className="gap-2"
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          <Download className="size-4" />
          {exporting ? "Preparing…" : "Export all data (JSON)"}
        </Button>
      </SettingsSectionCard>

      <SettingsSectionCard title="Import" description="Restore from a backup file.">
        <p className="font-sans text-sm text-muted-foreground">
          Import is coming soon. Exports are JSON for now.
        </p>
        <Button type="button" variant="outline" disabled>
          Import data (coming soon)
        </Button>
      </SettingsSectionCard>
    </div>
  );
}
