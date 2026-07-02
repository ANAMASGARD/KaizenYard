import { tool } from "ai";
import { z } from "zod";
import { bindDelegateToSession } from "@/lib/assistant/sessions/actions";
import { hashActionSummary } from "@/lib/assistant/privacy/envelope";
import { recordWitnessAttestation } from "@/lib/witness/attestations";
import { computeWitnessNullifier } from "@/lib/assistant/witness/commitment";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";
import { rehydrateToolInput } from "@/lib/assistant/privacy/gateway";

export function createDelegateTools(ctx: AssistantToolContext, sessionId: number) {
  return {
    bindDelegateWallet: tool({
      description: "Bind a Stellar Freighter wallet address as pseudonymous delegate identity.",
      inputSchema: z.object({
        walletAddress: z.string().min(10),
      }),
      needsApproval: true,
      execute: async (input) => {
        const hydrated = await rehydrateToolInput(input, ctx.agentSessionId, ctx.privacyMode);
        const session = await bindDelegateToSession(sessionId, hydrated.walletAddress);
        return {
          delegateAddress: session.delegateAddress,
          privacyMode: session.privacyMode,
        };
      },
    }),

    logDelegateAction: tool({
      description: "Log a delegate action with on-chain-ready action hash.",
      inputSchema: z.object({
        actionSummary: z.string(),
        resourceType: z.string().optional(),
        resourceId: z.number().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        if (!ctx.delegateAddress) {
          return { error: "No delegate wallet bound" };
        }
        const actionHash = hashActionSummary(hydrated.actionSummary);
        const nullifier = computeWitnessNullifier(ctx.delegateAddress, sessionId);

        if (ctx.witnessGroupId) {
          await recordWitnessAttestation({
            witnessGroupId: ctx.witnessGroupId,
            nullifier,
            actionHash,
            resourceType: hydrated.resourceType ?? "delegate_action",
            resourceId: hydrated.resourceId,
            privacyMode: "delegate",
          });
        }

        return {
          delegateAddress: ctx.delegateAddress,
          actionHash,
          nullifier,
          logged: true,
        };
      }),
    }),
  };
}
