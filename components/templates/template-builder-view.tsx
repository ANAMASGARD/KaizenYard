"use client";

import { useState, type ChangeEvent } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createGeneratedApp } from "@/lib/templates/actions";
import type { GeneratedAppDefinition } from "@/lib/templates/types";
import {
  PROMPT_MAX_LENGTH,
  SUGGESTION_PROMPTS,
} from "@/lib/templates/types";
import { useGeneratedApps } from "@/lib/templates/use-generated-apps";
import { useAiFeatures } from "@/lib/settings/use-ai-features";
import { DynamicAppRenderer } from "@/components/templates/dynamic-app-renderer";
import {
  GeneratedAppCard,
  GeneratedAppsEmptyState,
} from "@/components/templates/generated-app-card";
import { KaizenLoadingScreen } from "@/components/loading/kaizen-loading";
import { Alert } from "@/components/retroui/Alert";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { Loader } from "@/components/retroui/Loader";
import { Text } from "@/components/retroui/Text";
import { Textarea } from "@/components/retroui/Textarea";
import { cn } from "@/lib/utils";

type GenerateState = "idle" | "loading" | "error" | "success";

export function TemplateBuilderView() {
  const {
    apps,
    loading,
    refresh,
    handleDelete,
    handlePin,
    handleUnpin,
    pinnedCount,
  } = useGeneratedApps();
  const { isFeatureEnabled } = useAiFeatures();
  const templatesAiEnabled = isFeatureEnabled("templates");

  const [prompt, setPrompt] = useState("");
  const [generateState, setGenerateState] = useState<GenerateState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewDefinition, setPreviewDefinition] =
    useState<GeneratedAppDefinition | null>(null);

  const charsLeft = PROMPT_MAX_LENGTH - prompt.length;

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Enter a prompt to generate an app.");
      return;
    }

    setGenerateState("loading");
    setErrorMessage(null);
    setPreviewDefinition(null);

    try {
      const response = await fetch("/api/templates/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const payload = (await response.json()) as {
        definition?: GeneratedAppDefinition;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed");
      }

      if (!payload.definition) {
        throw new Error("AI returned no app definition");
      }

      await createGeneratedApp(payload.definition);
      setPreviewDefinition(payload.definition);
      setGenerateState("success");
      toast.success(`${payload.definition.appName} created`);
      await refresh();
    } catch (err) {
      setGenerateState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  };

  if (loading && apps.length === 0) {
    return <KaizenLoadingScreen label="Loading your apps…" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Text as="h1" className="mb-2">
          AI Template Builder
        </Text>
        <p className="max-w-2xl font-sans text-muted-foreground">
          Describe a mini app in plain language. Kaizenyard generates a
          single-page template, saves it to your account, and lets you pin up
          to three apps in the sidebar.
        </p>
      </header>

      <Card className="block w-full border-2 border-border p-4 shadow-md sm:p-6">
        <label
          htmlFor="template-prompt"
          className="mb-2 block font-head text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          App idea
        </label>
        <Textarea
          id="template-prompt"
          value={prompt}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setPrompt(event.target.value.slice(0, PROMPT_MAX_LENGTH))
          }
          placeholder="Build a Habit Tracker to track daily habits, streaks, and weekly progress."
          rows={4}
          className="mb-2"
        />
        <div className="mb-4 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Try these ideas:</span>
          <span>{charsLeft} characters left</span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTION_PROMPTS.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => setPrompt(suggestion.prompt)}
              className={cn(
                "rounded border-2 border-border bg-background px-3 py-1.5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
              )}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => void handleGenerate()}
          disabled={generateState === "loading" || !prompt.trim() || !templatesAiEnabled}
          className="w-full sm:w-auto"
          title={
            templatesAiEnabled
              ? undefined
              : "AI Template Builder is disabled in Settings → AI"
          }
        >
          <Sparkles className="size-4" />
          Generate
        </Button>
      </Card>

      {generateState === "loading" ? (
        <Card className="flex w-full items-center justify-center gap-3 border-2 border-border p-8 shadow-md">
          <Loader size="md" />
          <p className="font-sans text-muted-foreground">
            Generating your mini app…
          </p>
        </Card>
      ) : null}

      {generateState === "error" && errorMessage ? (
        <Alert status="error" className="shadow-md">
          <p className="font-head text-sm">Oops! Something went wrong</p>
          <p className="mt-1 text-sm">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void handleGenerate()}
          >
            Try again
          </Button>
        </Alert>
      ) : null}

      {generateState === "success" && previewDefinition ? (
        <section>
          <h2 className="mb-3 font-head text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Preview
          </h2>
          <DynamicAppRenderer definition={previewDefinition} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 font-head text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Created Apps
        </h2>
        {apps.length === 0 ? (
          <GeneratedAppsEmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <GeneratedAppCard
                key={app.id}
                app={app}
                pinnedCount={pinnedCount}
                onPin={handlePin}
                onUnpin={handleUnpin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
