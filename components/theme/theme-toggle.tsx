"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** When true, use light-on-dark styling (e.g. landing hero navbar). */
  onHero?: boolean;
};

export function ThemeToggle({ className, onHero = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <span
        className={cn("inline-flex size-9 shrink-0", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "relative size-9 shrink-0 border-2 border-border bg-background shadow-sm",
        onHero &&
          "border-white/80 text-white shadow-[2px_2px_0_0_rgba(255,255,255,0.8)] hover:bg-white/10 hover:text-white",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-200",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
        aria-hidden
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-200",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
        )}
        aria-hidden
      />
    </Button>
  );
}
