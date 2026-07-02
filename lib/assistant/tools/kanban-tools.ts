import { tool } from "ai";
import { z } from "zod";
import {
  listBoards,
  listBoardData,
  createBoard,
  createTask,
  updateTask,
  moveTask,
} from "@/lib/kanban/actions";
import { KANBAN_COLORS } from "@/lib/kanban/colors";
import { KANBAN_PRIORITIES } from "@/lib/kanban/labels";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { tagKanbanTaskDelegate } from "@/lib/witness/attestations";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";
import { rehydrateToolInput, tokenizeToolResult } from "@/lib/assistant/privacy/gateway";

export function createKanbanTools(ctx: AssistantToolContext) {
  return {
    listBoards: tool({
      description: "List all kanban boards for the user.",
      inputSchema: z.object({}),
      execute: privacyExecute(ctx, async () => {
        const boards = await listBoards();
        return boards.map((b) => ({ id: b.id, name: b.name, color: b.color }));
      }),
    }),

    getBoard: tool({
      description: "Get full board data including columns and tasks.",
      inputSchema: z.object({ boardId: z.number() }),
      execute: privacyExecute(ctx, async ({ boardId }) => {
        const data = await listBoardData(boardId);
        return {
          board: { id: data.board.id, name: data.board.name },
          columns: data.columns.map((c) => ({ id: c.id, name: c.name })),
          tasks: data.tasks.map((t) => ({
            id: t.id,
            columnId: t.columnId,
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            priority: t.priority,
          })),
        };
      }),
    }),

    createBoard: tool({
      description: "Create a new kanban board.",
      inputSchema: z.object({
        name: z.string(),
        color: z.enum(KANBAN_COLORS).optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        const data = await createBoard({
          name: hydrated.name,
          color: hydrated.color ?? "blue",
        });
        return { boardId: data.board.id, name: data.board.name };
      }),
    }),

    createTask: tool({
      description: "Create a kanban task in a column.",
      inputSchema: z.object({
        columnId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(KANBAN_PRIORITIES).optional(),
        syncCalendar: z.boolean().optional(),
      }),
      needsApproval: true,
      execute: async (input) => {
        const hydrated = await rehydrateToolInput(input, ctx.agentSessionId, ctx.privacyMode);
        const task = await createTask({
          columnId: hydrated.columnId,
          title: hydrated.title,
          description: hydrated.description,
          dueDate: hydrated.dueDate,
          priority: hydrated.priority,
          syncCalendar: hydrated.syncCalendar,
        });
        if (ctx.delegateAddress) {
          await tagKanbanTaskDelegate(task.id, ctx.delegateAddress);
        }
        return tokenizeToolResult(
          { taskId: task.id, title: task.title, columnId: task.columnId },
          ctx.agentSessionId,
          ctx.privacyMode,
        );
      },
    }),

    updateTask: tool({
      description: "Update an existing kanban task.",
      inputSchema: z.object({
        taskId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(KANBAN_PRIORITIES).optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        const task = await updateTask(hydrated.taskId, {
          title: hydrated.title,
          description: hydrated.description,
          dueDate: hydrated.dueDate,
          priority: hydrated.priority,
        });
        return { taskId: task.id, title: task.title };
      }),
    }),

    moveTask: tool({
      description: "Move a task to another column.",
      inputSchema: z.object({
        taskId: z.number(),
        targetColumnId: z.number(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (hydrated) => {
        await moveTask(hydrated.taskId, hydrated.targetColumnId, 0);
        return { success: true };
      }),
    }),
  };
}
