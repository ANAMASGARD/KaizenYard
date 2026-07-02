"use client";

import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { WitnessAnchorButton } from "@/components/assistant/witness-anchor-button";
import { WitnessBadge } from "@/components/assistant/witness-badge";
import type { UIMessage } from "ai";

type ToolPart = {
  type: string;
  toolCallId?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart & UIMessage["parts"][number] {
  return typeof part === "object" && part !== null && "type" in part && String(part.type).startsWith("tool-");
}

function isWitnessAnchorOutput(
  output: unknown,
): output is {
  witnessGroupId: number;
  commitment: string;
  nullifier: string;
  actionHash: string;
  verifiedAnonymous?: boolean;
} {
  if (!output || typeof output !== "object") return false;
  const o = output as Record<string, unknown>;
  return (
    typeof o.witnessGroupId === "number" &&
    typeof o.commitment === "string" &&
    typeof o.nullifier === "string" &&
    typeof o.actionHash === "string"
  );
}

type AssistantToolPartProps = {
  part: UIMessage["parts"][number];
};

export function AssistantToolPart({ part }: AssistantToolPartProps) {
  if (!isToolPart(part)) return null;

  const name = part.toolName ?? part.type.replace("tool-", "");
  const preview =
    part.output !== undefined
      ? JSON.stringify(part.output, null, 2).slice(0, 400)
      : part.input !== undefined
        ? JSON.stringify(part.input, null, 2).slice(0, 200)
        : "";

  const anchorOutput = part.output !== undefined ? part.output : null;

  return (
    <Card className="mt-2 border-2 border-border bg-muted/30 p-3 text-left shadow-sm">
      <p className="font-head text-[10px] uppercase tracking-wider text-muted-foreground">
        Tool · {name}
      </p>
      {part.state ? (
        <p className="mt-1 font-sans text-xs text-muted-foreground">State: {part.state}</p>
      ) : null}
      {isWitnessAnchorOutput(anchorOutput) && anchorOutput.verifiedAnonymous ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <WitnessBadge />
          <WitnessAnchorButton
            witnessGroupId={anchorOutput.witnessGroupId}
            commitment={anchorOutput.commitment}
            nullifier={anchorOutput.nullifier}
            actionHash={anchorOutput.actionHash}
          />
        </div>
      ) : null}
      {preview ? (
        <pre className="mt-2 max-h-32 overflow-auto font-mono text-[10px] text-foreground">
          {preview}
        </pre>
      ) : null}
    </Card>
  );
}

type AssistantApprovalCardProps = {
  toolName: string;
  input: unknown;
  onApprove: () => void;
  onDeny: () => void;
};

export function AssistantApprovalCard({
  toolName,
  input,
  onApprove,
  onDeny,
}: AssistantApprovalCardProps) {
  return (
    <Card className="mt-2 border-2 border-amber-500 bg-amber-50 p-4 shadow-md dark:bg-amber-950/20">
      <p className="font-head text-sm">Approve action?</p>
      <p className="mt-1 font-sans text-xs text-muted-foreground">
        <span className="font-head uppercase">{toolName}</span>
      </p>
      <pre className="mt-2 max-h-24 overflow-auto rounded border border-border bg-background p-2 font-mono text-[10px]">
        {JSON.stringify(input, null, 2)}
      </pre>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="default" size="sm" onClick={onApprove}>
          Approve
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDeny}>
          Deny
        </Button>
      </div>
    </Card>
  );
}
