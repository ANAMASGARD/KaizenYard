import { Card } from "@/components/retroui/Card";
import { Text } from "@/components/retroui/Text";
import { cn } from "@/lib/utils";

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSectionCard({
  title,
  description,
  children,
  className,
}: SettingsSectionCardProps) {
  return (
    <Card className={cn("w-full border-2 border-border shadow-md", className)}>
      <div className="border-b-2 border-border p-4 sm:p-5">
        <Text as="h2" className="text-lg">
          {title}
        </Text>
        {description ? (
          <p className="mt-1 font-sans text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-5 p-4 sm:p-5">{children}</div>
    </Card>
  );
}

type SettingsRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
};

export function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-head text-xs uppercase tracking-[0.15em]">{label}</p>
        {description ? (
          <p className="mt-1 font-sans text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
