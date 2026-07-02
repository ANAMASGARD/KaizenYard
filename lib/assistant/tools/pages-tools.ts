import { tool } from "ai";
import { z } from "zod";
import { listSpaces, searchSpacesAndPages, getPage, createPage, getSpace } from "@/lib/pages/actions";
import { tiptapJsonToPlainText } from "@/lib/assistant/tiptap-text";
import type { AssistantToolContext } from "@/lib/assistant/types";
import { privacyExecute } from "@/lib/assistant/tools/privacy-tool";
import { requiresVaultGate } from "@/lib/assistant/modes";

export function createPagesTools(ctx: AssistantToolContext) {
  return {
    listSpaces: tool({
      description: "List pages & spaces folders.",
      inputSchema: z.object({ filter: z.enum(["all", "favorites", "archived"]).optional() }),
      execute: privacyExecute(ctx, async ({ filter }) => {
        const spaces = await listSpaces({ filter: filter ?? "all" });
        return spaces.map((s) => ({
          id: s.id,
          name: s.isVault && requiresVaultGate(ctx.privacyMode) ? "[VAULT_LOCKED]" : s.name,
          isVault: s.isVault,
          pageCount: s.pageCount,
        }));
      }),
    }),

    searchPages: tool({
      description: "Search spaces and pages by query.",
      inputSchema: z.object({ query: z.string() }),
      execute: privacyExecute(ctx, async ({ query }) => searchSpacesAndPages(query)),
    }),

    getPage: tool({
      description: "Get page content excerpt. Vault pages require unlock session.",
      inputSchema: z.object({ pageId: z.number() }),
      execute: privacyExecute(ctx, async ({ pageId }) => {
        const pageMeta = await getPage(pageId);
        if (!pageMeta) {
          return { error: "Page not found" };
        }
        const space = await getSpace(pageMeta.spaceId);
        const isVault = space?.isVault ?? false;
        const unlocked = ctx.vaultUnlockedSpaceIds?.includes(pageMeta.spaceId);
        const vaultLocked = isVault && !unlocked;

        if (vaultLocked && requiresVaultGate(ctx.privacyMode)) {
          return {
            error: "Vault locked",
            hint: "Unlock this space in Pages UI or switch to Vault Witness mode with Freighter.",
          };
        }

        const page = await getPage(pageId, { vaultLocked });
        if (!page) {
          return { error: "Page not found" };
        }
        const text = tiptapJsonToPlainText(page.content);
        return {
          id: page.id,
          title: page.title,
          spaceId: page.spaceId,
          contentExcerpt: text.slice(0, 2000),
        };
      }),
    }),

    createPage: tool({
      description: "Create a page in a non-vault space.",
      inputSchema: z.object({
        spaceId: z.number(),
        title: z.string().optional(),
        template: z
          .enum([
            "blank",
            "project_plan",
            "meeting_notes",
            "prd",
            "research_notes",
            "task_plan",
          ])
          .optional(),
      }),
      needsApproval: true,
      execute: privacyExecute(ctx, async (input) => {
        const page = await createPage({
          spaceId: input.spaceId,
          title: input.title,
          template: input.template,
        });
        return { pageId: page.id, title: page.title, spaceId: page.spaceId };
      }),
    }),
  };
}
