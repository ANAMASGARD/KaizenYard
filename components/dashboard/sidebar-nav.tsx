"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_NAV_GROUPS,
  GENERATED_APPS_GROUP_LABEL,
  type GeneratedNavItem,
  type NavItem,
} from "@/components/dashboard/nav-config";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { TemplateIcon } from "@/components/templates/template-icon";
import { Tooltip } from "@/components/retroui/Tooltip";
import { collapsedRailItem } from "@/components/dashboard/sidebar-rail";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded border-2 border-transparent font-sans text-sm transition-all",
        collapsed ? collapsedRailItem : "gap-2.5 px-2.5 py-1.5",
        active
          ? cn(
              "border-border bg-primary font-medium text-primary-foreground",
              collapsed ? "shadow-none" : "shadow-sm",
            )
          : "text-foreground hover:border-border/20 hover:bg-sidebar-accent",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-4 shrink-0", !active && item.iconClassName)} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <Tooltip.Trigger render={link} />
        <Tooltip.Content side="right">{item.label}</Tooltip.Content>
      </Tooltip>
    );
  }

  return link;
}

function GeneratedNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: GeneratedNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center rounded border-2 border-transparent font-sans text-sm transition-all",
        collapsed ? collapsedRailItem : "gap-2.5 px-2.5 py-1.5",
        active
          ? cn(
              "border-border bg-primary font-medium text-primary-foreground",
              collapsed ? "shadow-none" : "shadow-sm",
            )
          : "text-foreground hover:border-border/20 hover:bg-sidebar-accent",
      )}
      aria-current={active ? "page" : undefined}
    >
      <TemplateIcon
        name={item.iconName}
        className="size-4 shrink-0"
        style={active ? undefined : { color: item.color }}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <Tooltip.Trigger render={link} />
        <Tooltip.Content side="right">{item.label}</Tooltip.Content>
      </Tooltip>
    );
  }

  return link;
}

function NavGroupSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="px-1.5">
      {!collapsed && (
        <p className="mb-1.5 px-2.5 font-head text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

export function SidebarNav({
  onNavigate,
  forceExpanded = false,
  generatedApps = [],
}: {
  onNavigate?: () => void;
  forceExpanded?: boolean;
  generatedApps?: GeneratedNavItem[];
}) {
  const { collapsed } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <Tooltip.Provider>
      <nav className="flex flex-col gap-4 py-3">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <NavGroupSection key={group.label} label={group.label} collapsed={isCollapsed}>
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </NavGroupSection>
        ))}

        {generatedApps.length > 0 ? (
          <NavGroupSection
            label={GENERATED_APPS_GROUP_LABEL}
            collapsed={isCollapsed}
          >
            {generatedApps.map((item) => (
              <li key={item.href}>
                <GeneratedNavLink
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </NavGroupSection>
        ) : null}
      </nav>
    </Tooltip.Provider>
  );
}
