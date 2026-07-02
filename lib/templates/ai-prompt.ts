import { ALLOWED_ICON_NAMES } from "@/lib/templates/icons";

export function buildTemplateGenerationPrompt(userPrompt: string): string {
  return `You are a UI schema generator for Kaizenyard, a privacy-first productivity app with a neo-brutalist RetroUI design system.
Return ONLY valid JSON (no markdown fences, no commentary) matching this exact shape:

{
  "appName": "string",
  "description": "string",
  "icon": "LucideIconName",
  "color": "#RRGGBB",
  "layout": "single-page",
  "sections": [ ... ],
  "actions": [ { "id": "string", "label": "string", "variant": "default|outline|secondary" } ],
  "sampleData": { "sectionId": { ...initial runtime values... } }
}

Rules:
- appName: concise, max 80 chars
- description: one sentence, max 300 chars
- icon: one of ${ALLOWED_ICON_NAMES.join(", ")}
- color: hex accent color matching the app theme
- layout: always "single-page"
- sections: 4-10 blocks, each with unique "id" (kebab-case)
- every section may include layout: "full" | "half" | "third"
- use layout to create polished responsive dashboards:
  - stats and large forms are usually "full"
  - checklist + progress side by side should be "half"
  - small streak cards / summary groups can be "third"
- Allowed section types:
  - stats: { type, id, title?, layout?, columns?, items: [{ label, value, hint? }] }
  - list: { type, id, title?, items: [{ title, subtitle?, tag? }] }
  - table: { type, id, title?, columns: string[], rows: string[][] }
  - form: { type, id, title?, layout?, fields: [{ id, label, type: text|number|email|textarea|select, placeholder?, options? }] }
  - progress: { type, id, title?, label, value, max }
  - checklist: { type, id, title?, items: [{ id, label, checked? }] }
  - tags: { type, id, title?, items: string[] }
  - chart: { type, id, title?, chartType: bar|line|donut }
  - text: { type, id, title?, content, heading?: boolean }
- actions: 0-4 footer buttons with unique ids
- sampleData: keyed by section id; include realistic initial values for interactive sections (checklist checked states, form field values, progress values)
- Use realistic sample content tailored to the user's request
- Do not include fields outside this schema
- The UI should feel like Kaizenyard: strong borders, compact cards, useful labels, balanced sections, practical productivity data
- Prefer RetroUI-friendly layouts over plain long vertical stacks

Example Habit Tracker JSON:
{
  "appName": "Kaizen Habits",
  "description": "A focused daily tracker to build consistent routines, monitor streaks, and visualize your weekly progress toward long-term goals.",
  "icon": "Flame",
  "color": "#F97316",
  "layout": "single-page",
  "sections": [
    {
      "id": "overview",
      "type": "stats",
      "title": "Overview",
      "layout": "full",
      "columns": 3,
      "items": [
        { "label": "Current Streak", "value": "5 Days" },
        { "label": "Completion", "value": "60%" },
        { "label": "Daily Habits", "value": "4" }
      ]
    },
    {
      "id": "weekly-goal",
      "type": "progress",
      "title": "Weekly Goal",
      "layout": "half",
      "label": "Completion Rate",
      "value": 35,
      "max": 100
    },
    {
      "id": "consistency",
      "type": "chart",
      "title": "Consistency",
      "layout": "half",
      "chartType": "bar"
    },
    {
      "id": "daily-habits",
      "type": "checklist",
      "title": "Today",
      "layout": "half",
      "items": [
        { "id": "morning-run", "label": "Morning Run", "checked": true },
        { "id": "reading", "label": "Read 10 Pages", "checked": false },
        { "id": "meditation", "label": "Meditate", "checked": true }
      ]
    },
    {
      "id": "hot-streaks",
      "type": "list",
      "title": "Hot Streaks",
      "layout": "half",
      "items": [
        { "title": "Morning Run", "subtitle": "14 Days", "tag": "Fitness" },
        { "title": "Reading", "subtitle": "5 Days", "tag": "Growth" }
      ]
    },
    {
      "id": "add-habit",
      "type": "form",
      "title": "Add Habit",
      "layout": "full",
      "fields": [
        { "id": "habit-name", "label": "Habit Name", "type": "text", "placeholder": "E.g. Read 10 Pages" },
        { "id": "frequency", "label": "Frequency", "type": "select", "options": ["Daily", "Weekdays", "Weekly"] },
        { "id": "category", "label": "Category", "type": "select", "options": ["Health", "Productivity", "Mindfulness", "Finance"] }
      ]
    }
  ],
  "actions": [
    { "id": "save-progress", "label": "Save Progress", "variant": "default" },
    { "id": "add-habit", "label": "New Habit", "variant": "outline" },
    { "id": "reset-day", "label": "Reset Day", "variant": "secondary" }
  ],
  "sampleData": {
    "weekly-goal": { "value": 35, "max": 100 },
    "daily-habits": {
      "items": [
        { "id": "morning-run", "label": "Morning Run", "checked": true },
        { "id": "reading", "label": "Read 10 Pages", "checked": false },
        { "id": "meditation", "label": "Meditate", "checked": true }
      ]
    },
    "add-habit": {
      "habit-name": "",
      "frequency": "Daily",
      "category": "Health"
    }
  }
}

User request:
${userPrompt}`;
}
