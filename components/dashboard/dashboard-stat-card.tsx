import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/retroui/Card";
import { dashboardStatCardClass } from "@/components/dashboard/dashboard-layout";
import { cn } from "@/lib/utils";

type DashboardStatCardProps = {
  href: string;
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
};

export function DashboardStatCard({
  href,
  label,
  value,
  icon: Icon,
  iconClassName,
}: DashboardStatCardProps) {
  return (
    <Link href={href} className="group flex h-full min-h-[6.75rem] w-full min-w-0">
      <Card className={dashboardStatCardClass}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <Icon className={cn("size-5 shrink-0", iconClassName)} aria-hidden />
          <span className="font-head text-2xl font-bold tabular-nums leading-none">
            {value}
          </span>
        </div>
        <p className="mt-auto line-clamp-2 font-sans text-sm leading-snug text-muted-foreground">
          {label}
        </p>
      </Card>
    </Link>
  );
}
