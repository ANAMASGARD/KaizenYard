"use client";

type PagesSectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function PagesSectionHeader({
  title,
  subtitle,
  actions,
}: PagesSectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-head text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Pages & Spaces
        </p>
        <h1 className="mt-1 font-head text-2xl sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
