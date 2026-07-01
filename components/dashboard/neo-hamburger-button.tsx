import { cn } from "@/lib/utils";

type NeoHamburgerButtonProps = {
  onClick: () => void;
  label: string;
  className?: string;
};

export function NeoHamburgerButton({
  onClick,
  label,
  className,
}: NeoHamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-9 shrink-0 flex-col items-center justify-center gap-1 rounded border-2 border-border bg-background p-1.5 shadow-md transition-all",
        "hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 active:shadow-sm",
        className,
      )}
    >
      <span className="block h-0.5 w-4 bg-foreground" />
      <span className="block h-0.5 w-4 bg-foreground" />
      <span className="block h-0.5 w-4 bg-foreground" />
    </button>
  );
}
