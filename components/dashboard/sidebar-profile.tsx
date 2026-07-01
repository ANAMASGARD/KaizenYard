"use client";

import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { clerkAppearance } from "@/components/dashboard/clerk-appearance";
import {
  collapsedRailButton,
  collapsedRailItem,
} from "@/components/dashboard/sidebar-rail";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { Button } from "@/components/retroui/Button";
import { Tooltip } from "@/components/retroui/Tooltip";
import { maskEmail } from "@/lib/mask-email";
import { cn } from "@/lib/utils";

export function SidebarProfile({
  forceExpanded = false,
}: {
  forceExpanded?: boolean;
}) {
  const { user } = useUser();
  const { collapsed } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  const displayName =
    user?.fullName ?? user?.firstName ?? user?.username ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const maskedEmail = email ? maskEmail(email) : "";

  const signOutButton = (
    <SignOutButton>
      <Button
        type="button"
        variant={isCollapsed ? "ghost" : "outline"}
        size="icon"
        className={isCollapsed ? collapsedRailButton : undefined}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </SignOutButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip.Provider>
        <div className="mt-auto w-full shrink-0 border-t-2 border-border py-3">
          <div className="flex w-full flex-col items-center gap-2">
            <Tooltip>
              <Tooltip.Trigger
                render={
                  <div className={cn(collapsedRailItem, "overflow-hidden")}>
                    <UserButton appearance={clerkAppearance} />
                  </div>
                }
              />
              <Tooltip.Content side="right">
                <span className="block font-head text-xs font-semibold">
                  {displayName}
                </span>
                {maskedEmail && (
                  <span className="block font-sans text-[10px] text-muted-foreground">
                    {maskedEmail}
                  </span>
                )}
              </Tooltip.Content>
            </Tooltip>

            <Tooltip>
              <Tooltip.Trigger render={signOutButton} />
              <Tooltip.Content side="right">Sign out</Tooltip.Content>
            </Tooltip>
          </div>
        </div>
      </Tooltip.Provider>
    );
  }

  return (
    <div className="mt-auto w-full shrink-0 space-y-2 border-t-2 border-border p-2">
      <div className="flex items-center gap-2 rounded border-2 border-border bg-background p-2 shadow-sm">
        <UserButton appearance={clerkAppearance} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-head text-sm font-semibold">{displayName}</p>
          {maskedEmail && (
            <p
              className="truncate font-sans text-xs text-muted-foreground"
              title="Email partially hidden for privacy"
            >
              {maskedEmail}
            </p>
          )}
        </div>
      </div>

      <SignOutButton>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          <span className="ms-2">Sign out</span>
        </Button>
      </SignOutButton>
    </div>
  );
}
