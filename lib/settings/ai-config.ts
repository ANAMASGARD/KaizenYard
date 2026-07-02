import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, userSettings } from "@/db";
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults";
import type { AiBehavior, AiFeatures, AiTone } from "@/lib/settings/types";

export type AiFeatureKey = keyof AiFeatures;

export type ResolvedAiConfig = {
  model: string;
  behavior: AiBehavior;
  tone: AiTone;
  outputLanguage: string;
  allowDataUsage: boolean;
  features: AiFeatures;
};

function rowToAiConfig(row: typeof userSettings.$inferSelect): ResolvedAiConfig {
  return {
    model: row.aiModel,
    behavior: row.aiBehavior as AiBehavior,
    tone: row.aiTone as AiTone,
    outputLanguage: row.aiOutputLanguage,
    allowDataUsage: row.allowAiDataUsage,
    features: row.aiFeatures as AiFeatures,
  };
}

async function loadAiConfigForClerkId(clerkId: string): Promise<ResolvedAiConfig> {
  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkId, clerkId));

  if (!row) {
    return {
      model: DEFAULT_USER_SETTINGS.aiModel,
      behavior: DEFAULT_USER_SETTINGS.aiBehavior,
      tone: DEFAULT_USER_SETTINGS.aiTone,
      outputLanguage: DEFAULT_USER_SETTINGS.aiOutputLanguage,
      allowDataUsage: DEFAULT_USER_SETTINGS.allowAiDataUsage,
      features: DEFAULT_USER_SETTINGS.aiFeatures,
    };
  }

  return rowToAiConfig(row);
}

export async function getAiConfigForUser(userId?: string): Promise<ResolvedAiConfig> {
  if (!userId) {
    const session = await auth();
    userId = session.userId ?? undefined;
  }

  if (!userId) {
    return {
      model: DEFAULT_USER_SETTINGS.aiModel,
      behavior: DEFAULT_USER_SETTINGS.aiBehavior,
      tone: DEFAULT_USER_SETTINGS.aiTone,
      outputLanguage: DEFAULT_USER_SETTINGS.aiOutputLanguage,
      allowDataUsage: DEFAULT_USER_SETTINGS.allowAiDataUsage,
      features: DEFAULT_USER_SETTINGS.aiFeatures,
    };
  }

  return loadAiConfigForClerkId(userId);
}

const BEHAVIOR_PROMPTS: Record<AiBehavior, string> = {
  helpful: "Be thorough, proactive, and explain your reasoning when useful.",
  balanced: "Be clear and concise while staying accurate.",
  creative: "Be imaginative and explore alternative phrasings or ideas.",
};

const TONE_PROMPTS: Record<AiTone, string> = {
  friendly: "Use a warm, approachable tone.",
  professional: "Use a polished, professional tone.",
  casual: "Use a relaxed, conversational tone.",
  formal: "Use a formal, precise tone.",
};

export function buildAiSystemPromptSuffix(config: ResolvedAiConfig): string {
  const parts = [
    BEHAVIOR_PROMPTS[config.behavior],
    TONE_PROMPTS[config.tone],
    `Respond in language code "${config.outputLanguage}" unless the user explicitly requests another language.`,
  ];
  return parts.join(" ");
}

export type AiRouteFeature =
  | "refine"
  | "templates"
  | "notesAi"
  | "tasksAi"
  | "summarization"
  | "assistant";

export function assertAiFeatureEnabled(
  config: ResolvedAiConfig,
  feature: AiRouteFeature,
): void {
  if (!config.allowDataUsage) {
    throw new AiFeatureDisabledError("AI data usage is disabled in your settings.");
  }
  if (!config.features[feature]) {
    throw new AiFeatureDisabledError(`The "${feature}" AI feature is disabled in your settings.`);
  }
}

export class AiFeatureDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiFeatureDisabledError";
  }
}
