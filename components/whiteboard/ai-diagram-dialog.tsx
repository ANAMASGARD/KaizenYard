"use client";

import { useState } from "react";
import {
  AI_DIAGRAM_TYPES,
  getDiagramTypeLabel,
  type AiDiagramType,
} from "@/lib/whiteboard/ai-diagram-prompts";
import type { ExcalidrawElementLike } from "@/lib/whiteboard/scene";
import { useAiFeatures } from "@/lib/settings/use-ai-features";
import { KaizenLoadingDots } from "@/components/loading/kaizen-loading";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Textarea } from "@/components/retroui/Textarea";

type AiDiagramDialogProps = {
  whiteboardId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onElementsGenerated: (elements: ExcalidrawElementLike[]) => void;
};

export function AiDiagramDialog({
  whiteboardId,
  open,
  onOpenChange,
  onElementsGenerated,
}: AiDiagramDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [diagramType, setDiagramType] = useState<AiDiagramType>("flowchart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isFeatureEnabled } = useAiFeatures();
  const diagramAiEnabled =
    isFeatureEnabled("summarization") && isFeatureEnabled("notesAi");

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Describe the diagram you want to generate.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/whiteboard/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whiteboardId,
          prompt: trimmed,
          diagramType,
        }),
      });

      const data = (await res.json()) as {
        elements?: ExcalidrawElementLike[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate diagram");
      }

      if (!data.elements?.length) {
        throw new Error("AI returned no diagram elements");
      }

      onElementsGenerated(data.elements);
      setPrompt("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-lg">
        <Dialog.Header asChild>
          <h2 className="font-head text-lg">AI Diagram Generator</h2>
        </Dialog.Header>
        <div className="space-y-4 py-2">
          <p className="font-sans text-sm text-muted-foreground">
            Describe a diagram and it will be added to your whiteboard canvas.
          </p>
          <div className="space-y-2">
            <label
              htmlFor="diagram-type"
              className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Diagram type
            </label>
            <select
              id="diagram-type"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value as AiDiagramType)}
              className="h-9 w-full rounded border-2 border-border bg-background px-2 font-sans text-sm shadow-sm"
            >
              {AI_DIAGRAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getDiagramTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="diagram-prompt"
              className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              Prompt
            </label>
            <Textarea
              id="diagram-prompt"
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPrompt(e.target.value)
              }
              placeholder="e.g. User signup flow from landing page to dashboard"
              rows={4}
            />
          </div>
          {error ? (
            <p className="font-sans text-sm text-red-600">{error}</p>
          ) : null}
        </div>
        <Dialog.Footer className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={loading || !diagramAiEnabled}
            title={
              diagramAiEnabled
                ? undefined
                : "AI diagrams are disabled in Settings → AI"
            }
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <KaizenLoadingDots size="sm" aria-label="Generating diagram" />
                Generating
              </span>
            ) : (
              "Generate"
            )}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
