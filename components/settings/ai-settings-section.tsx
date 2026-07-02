"use client";

import { updateAiFeatures } from "@/lib/settings/actions";
import {
  SettingsRow,
  SettingsSectionCard,
} from "@/components/settings/settings-section-card";
import { Switch } from "@/components/retroui/Switch";
import { AI_MODEL_OPTIONS } from "@/lib/settings/defaults";
import { useUserSettingsState } from "@/lib/settings/use-user-settings";
import type { AiBehavior, AiFeatures, AiTone } from "@/lib/settings/types";

const FEATURE_LABELS: { key: keyof AiFeatures; label: string; description: string }[] = [
  { key: "refine", label: "AI Refine", description: "Improve selected text in notes." },
  { key: "assistant", label: "AI Assistant", description: "Kaizen Witness — privacy proxy agent with tool calling." },
  { key: "templates", label: "AI Template Builder", description: "Generate mini apps from prompts." },
  { key: "autoSuggestions", label: "AI Auto Suggestions", description: "Inline suggestions while typing." },
  { key: "summarization", label: "Smart Summarization", description: "Summaries and whiteboard diagrams." },
  { key: "notesAi", label: "AI in Notes", description: "All note-related AI features." },
  { key: "tasksAi", label: "AI in Tasks", description: "Task-focused AI helpers." },
];

export function AiSettingsSection() {
  const { settings, loading, saveDebounced, setSettings } = useUserSettingsState();

  if (loading || !settings) {
    return (
      <SettingsSectionCard title="AI Settings">
        <div className="h-24 animate-pulse rounded bg-muted/40" />
      </SettingsSectionCard>
    );
  }

  async function toggleFeature(key: keyof AiFeatures, checked: boolean) {
    if (!settings) return;
    const nextFeatures = { ...settings.aiFeatures, [key]: checked };
    setSettings({ ...settings, aiFeatures: nextFeatures });
    const updated = await updateAiFeatures({ [key]: checked });
    setSettings(updated);
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="AI Settings"
        description="Choose models, tone, and which AI features are enabled."
      >
        <SettingsRow label="Preferred model">
          <select
            className="h-9 min-w-[14rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
            value={settings.aiModel}
            onChange={(e) => saveDebounced({ aiModel: e.target.value })}
          >
            {AI_MODEL_OPTIONS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow label="Default behavior">
          <select
            className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
            value={settings.aiBehavior}
            onChange={(e) =>
              saveDebounced({ aiBehavior: e.target.value as AiBehavior })
            }
          >
            <option value="helpful">Helpful</option>
            <option value="balanced">Balanced</option>
            <option value="creative">Creative</option>
          </select>
        </SettingsRow>

        <SettingsRow label="Response tone">
          <select
            className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
            value={settings.aiTone}
            onChange={(e) => saveDebounced({ aiTone: e.target.value as AiTone })}
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
          </select>
        </SettingsRow>

        <SettingsRow label="Output language">
          <select
            className="h-9 min-w-[12rem] rounded border-2 border-border bg-background px-2 text-sm shadow-sm"
            value={settings.aiOutputLanguage}
            onChange={(e) => saveDebounced({ aiOutputLanguage: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
          </select>
        </SettingsRow>

        <SettingsRow
          label="Allow AI data usage"
          description="When off, AI API routes are blocked for your account."
        >
          <Switch
            checked={settings.allowAiDataUsage}
            onCheckedChange={(checked) => saveDebounced({ allowAiDataUsage: checked })}
          />
        </SettingsRow>
      </SettingsSectionCard>

      <SettingsSectionCard title="AI features" description="Toggle individual AI capabilities.">
        {FEATURE_LABELS.map((feature) => (
          <SettingsRow key={feature.key} label={feature.label} description={feature.description}>
            <Switch
              checked={settings.aiFeatures[feature.key]}
              onCheckedChange={(checked) => void toggleFeature(feature.key, checked)}
            />
          </SettingsRow>
        ))}
      </SettingsSectionCard>
    </div>
  );
}
