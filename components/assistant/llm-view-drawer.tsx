"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Drawer } from "@/components/retroui/Drawer";
import { KaizenLoadingInline } from "@/components/loading/kaizen-loading";

type LlmViewDrawerProps = {
  sessionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

async function fetchLlmView(sessionId: number): Promise<string> {
  const res = await fetch(`/api/assistant/privacy/llm-view?sessionId=${sessionId}`);
  const data = (await res.json()) as { llmView?: string };
  return data.llmView ?? "";
}

export function LlmViewDrawer({ sessionId, open, onOpenChange }: LlmViewDrawerProps) {
  const [llmView, setLlmView] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (next && sessionId) {
      setLoading(true);
      void fetchLlmView(sessionId)
        .then(setLlmView)
        .finally(() => setLoading(false));
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <Drawer.Content className="max-w-2xl border-2 border-border bg-background p-0 shadow-lg">
        <Drawer.Header className="border-b-2 border-border p-4">
          <Drawer.Title className="font-head text-lg">What the LLM sees</Drawer.Title>
          <Drawer.Description className="font-sans text-sm text-muted-foreground">
            Tokenized prompt stream — your real identity never reaches OpenRouter.
          </Drawer.Description>
        </Drawer.Header>
        <div className="max-h-[60vh] overflow-auto p-4">
          {loading ? (
            <KaizenLoadingInline label="Loading LLM view…" />
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
              {llmView}
            </pre>
          )}
        </div>
      </Drawer.Content>
    </Drawer>
  );
}

export function LlmViewButton({
  sessionId,
  className,
}: {
  sessionId: number | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Eye className="mr-1.5 size-4" aria-hidden />
        LLM View
      </Button>
      <LlmViewDrawer sessionId={sessionId} open={open} onOpenChange={setOpen} />
    </>
  );
}
