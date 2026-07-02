"use client";

import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type ReadAloudProps = {
  getText: () => string;
  label: string;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
  error?: string | null;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function ReadAloud({
  getText,
  label,
  speak,
  stop,
  isSpeaking,
  supported,
  error,
  disabled = false,
  compact = false,
  className,
}: ReadAloudProps) {
  if (!supported) {
    return (
      <span className="font-sans text-[11px] text-muted-foreground">
        Read aloud is not supported in this browser.
      </span>
    );
  }

  function handleSpeak() {
    speak(getText());
  }

  return (
    <div className={cn(compact ? "inline-flex" : "flex flex-col gap-1", className)}>
      {!isSpeaking ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 border-violet-600 text-violet-700 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:shadow-sm dark:text-violet-300",
            compact ? "h-8 px-2.5 text-xs" : "gap-1",
          )}
          disabled={disabled}
          onClick={handleSpeak}
        >
          <Volume2 className={cn(compact ? "size-3.5" : "size-4")} />
          {label}
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          size="sm"
          className={cn(
            "gap-1.5 shadow-sm hover:translate-y-0 hover:shadow-sm active:translate-y-0 active:shadow-sm",
            compact ? "h-8 px-2.5 text-xs" : "gap-1",
          )}
          onClick={stop}
        >
          <Square
            className={cn("fill-current", compact ? "size-2.5" : "size-3")}
          />
          Stop
        </Button>
      )}

      {error && !compact ? (
        <p className="font-sans text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
