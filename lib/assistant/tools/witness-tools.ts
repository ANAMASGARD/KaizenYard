import { tool } from "ai";
import { z } from "zod";
import { createBoardRetroPulse } from "@/lib/kanban/board-pulse-actions";
import { hashActionSummary } from "@/lib/assistant/privacy/envelope";
import { createWitnessGroup, getWitnessGroupForParticipant } from "@/lib/witness/groups";
import {
  listWitnessAttestationsForGroup,
  recordWitnessAttestation,
  tagKanbanTaskWitnessAttestation,
} from "@/lib/witness/attestations";
import { createTask } from "@/lib/kanban/actions";
import { createNote } from "@/lib/notes/actions";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { rehydrateToolInput } from "@/lib/assistant/privacy/gateway";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";
import { computeWitnessNullifier, computeWitnessSessionCommitment } from "@/lib/assistant/witness/commitment";

export function createWitnessTools(ctx: AssistantToolContext) {
  return {
    startRetroPulse: tool({
      description: "Start an anonymous retro pulse on a kanban board with witness group.",
      inputSchema: z.object({
        boardId: z.number(),
        question: z.string().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) =>
        createBoardRetroPulse(hydrated.boardId, hydrated.question),
      ),
    }),

    getWitnessAggregates: tool({
      description: "Get anonymous aggregate stats for a witness group (no voter identity).",
      inputSchema: z.object({ witnessGroupId: z.number() }),
      execute: async ({ witnessGroupId }) => {
        try {
          const group = await getWitnessGroupForParticipant(witnessGroupId);
          const attestations = await listWitnessAttestationsForGroup(witnessGroupId);
          const taskCount = attestations.filter((a) => a.resourceType === "task").length;
          return {
            groupId: witnessGroupId,
            name: group.name,
            attestationCount: attestations.length,
            taskCount,
            message: `${attestations.length} verified anonymous action(s); ${taskCount} task(s) created.`,
          };
        } catch {
          return { error: "Witness group not found or closed" };
        }
      },
    }),

    submitWitnessFeedback: tool({
      description:
        "Submit anonymous witness feedback as a task or note with on-chain attestation.",
      inputSchema: z.object({
        witnessGroupId: z.number(),
        feedbackType: z.enum(["task", "note"]),
        columnId: z.number().optional(),
        title: z.string(),
        description: z.string().optional(),
        sessionSecret: z.string().optional(),
      }),
      needsApproval: true,
      execute: async (input) => {
        const hydrated = await rehydrateToolInput(input, ctx.agentSessionId, ctx.privacyMode);

        try {
          await getWitnessGroupForParticipant(hydrated.witnessGroupId);
        } catch {
          return { error: "Witness group not found or closed" };
        }

        const secret = hydrated.sessionSecret ?? ctx.agentSessionId;
        const commitment = await computeWitnessSessionCommitment(secret, hydrated.witnessGroupId);
        const nullifier = computeWitnessNullifier(secret, hydrated.witnessGroupId);
        const actionHash = hashActionSummary(`${hydrated.feedbackType}:${hydrated.title}`);

        let resourceId: number | undefined;
        let resourceType = hydrated.feedbackType;

        if (hydrated.feedbackType === "task") {
          if (!hydrated.columnId) {
            return { error: "columnId required for task feedback" };
          }
          const task = await createTask({
            columnId: hydrated.columnId,
            title: `[Anonymous] ${hydrated.title}`,
            description: hydrated.description,
          });
          resourceId = task.id;
          resourceType = "task";
        } else {
          const note = await createNote({
            title: `[Anonymous] ${hydrated.title}`,
          });
          resourceId = note.id;
          resourceType = "note";
        }

        await recordWitnessAttestation({
          witnessGroupId: hydrated.witnessGroupId,
          nullifier,
          actionHash,
          resourceType,
          resourceId,
          privacyMode: "witness",
        });

        if (resourceType === "task" && resourceId) {
          await tagKanbanTaskWitnessAttestation(resourceId, actionHash);
        }

        return {
          success: true,
          resourceType,
          resourceId,
          witnessGroupId: hydrated.witnessGroupId,
          commitment: commitment.commitment,
          nullifier,
          actionHash,
          verifiedAnonymous: true,
        };
      },
    }),

    registerWitnessGroup: tool({
      description: "Register a new witness group for anonymous attestation.",
      inputSchema: z.object({
        name: z.string(),
        boardId: z.number().optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) =>
        createWitnessGroup({
          name: hydrated.name,
          boardId: hydrated.boardId,
        }),
      ),
    }),
  };
}
