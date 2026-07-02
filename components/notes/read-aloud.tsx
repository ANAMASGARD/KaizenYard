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
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1">
        {!isSpeaking ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "gap-1 border-violet-600 text-violet-700 dark:text-violet-300",
              compact && "h-7 px-2 text-xs",
            )}
            disabled={disabled}
            onClick={handleSpeak}
          >
            <Volume2 className={cn("size-4", compact && "size-3.5")} />
            {label}
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            className={cn("gap-1", compact && "h-7 px-2 text-xs")}
            onClick={stop}
          >
            <Square className={cn("size-3 fill-current", compact && "size-2.5")} />
            Stop
          </Button>
        )}
      </div>

      {error ? (
        <p className="font-sans text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
