import { z } from "zod";

const statsItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  hint: z.string().optional(),
});

const listItemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  tag: z.string().optional(),
});

const formFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "email", "textarea", "select"]),
  placeholder: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
});

const checklistItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  checked: z.boolean().optional(),
});

const sectionBaseSchema = {
  id: z.string().min(1),
  title: z.string().optional(),
  layout: z.enum(["full", "half", "third"]).optional(),
} as const;

const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...sectionBaseSchema,
    type: z.literal("stats"),
    items: z.array(statsItemSchema).min(1),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("list"),
    items: z.array(listItemSchema).min(1),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("table"),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("form"),
    fields: z.array(formFieldSchema).min(1),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("progress"),
    label: z.string().min(1),
    value: z.number().min(0),
    max: z.number().positive(),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("checklist"),
    items: z.array(checklistItemSchema).min(1),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("tags"),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("chart"),
    chartType: z.enum(["bar", "line", "donut"]),
  }),
  z.object({
    ...sectionBaseSchema,
    type: z.literal("text"),
    content: z.string().min(1),
    heading: z.boolean().optional(),
  }),
]);

const actionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  variant: z.enum(["default", "outline", "secondary"]).optional(),
});

export const generatedAppDefinitionSchema = z.object({
  appName: z.string().min(1).max(80),
  description: z.string().max(300),
  icon: z.string().min(1).max(64),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  layout: z.literal("single-page"),
  sections: z.array(sectionSchema).min(1).max(20),
  actions: z.array(actionSchema).max(6),
  sampleData: z.record(z.string(), z.unknown()),
});

export const runtimeStateSchema = z.record(z.string(), z.unknown());

export function parseGeneratedAppDefinition(
  raw: unknown,
): z.infer<typeof generatedAppDefinitionSchema> | null {
  const result = generatedAppDefinitionSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseRuntimeState(
  raw: unknown,
): Record<string, unknown> | null {
  const result = runtimeStateSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseJsonFromAiResponse(raw: string): unknown | null {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    return null;
  }
}
