"use client";

import { cn } from "@/lib/utils";

const DOT_DELAYS = ["0ms", "150ms", "300ms"] as const;

const dotSizeClasses = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3.5",
} as const;

const dotGapClasses = {
  sm: "gap-1",
  md: "gap-1.5",
  lg: "gap-2",
} as const;

type KaizenLoadingDotsProps = {
  size?: keyof typeof dotSizeClasses;
  className?: string;
  "aria-label"?: string;
};

export function KaizenLoadingDots({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading",
}: KaizenLoadingDotsProps) {
  return (
    <div
      className={cn("flex items-end", dotGapClasses[size], className)}
      role="status"
      aria-label={ariaLabel}
    >
      {DOT_DELAYS.map((delay, index) => (
        <span
          key={index}
          className={cn(
            "kaizen-loading-dot rounded-sm border-2 border-border bg-primary",
            dotSizeClasses[size],
          )}
          style={{ animationDelay: delay }}
          aria-hidden
        />
      ))}
    </div>
  );
}

type KaizenLoadingScreenProps = {
  label?: string;
  className?: string;
  fullHeight?: boolean;
};

export function KaizenLoadingScreen({
  label,
  className,
  fullHeight = true,
}: KaizenLoadingScreenProps) {
  return (
    <div
      className={cn(
        "kaizen-loading-screen-enter flex flex-col items-center justify-center gap-4",
        fullHeight && "h-full min-h-[16rem]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <KaizenLoadingDots size="lg" aria-label={label ?? "Loading"} />
      {label ? (
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}

type KaizenLoadingInlineProps = {
  label?: string;
  className?: string;
  size?: keyof typeof dotSizeClasses;
};

export function KaizenLoadingInline({
  label,
  className,
  size = "sm",
}: KaizenLoadingInlineProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <KaizenLoadingDots size={size} aria-label={label ?? "Loading"} />
      {label ? (
        <span className="font-sans text-sm text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}
