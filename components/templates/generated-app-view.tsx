"use client";

import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { ShareAppDialog } from "@/components/templates/share-app-dialog";
import type { GeneratedAppRecord } from "@/lib/templates/types";
import { DynamicAppRenderer } from "@/components/templates/dynamic-app-renderer";
import { Button, buttonVariants } from "@/components/retroui/Button";
import { cn } from "@/lib/utils";

type GeneratedAppViewProps = {
  app: GeneratedAppRecord;
};

export function GeneratedAppView({ app }: GeneratedAppViewProps) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/templates"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex w-fit",
          )}
        >
          <ArrowLeft className="size-4" />
          Template Builder
        </Link>
        <ShareAppDialog
          app={app}
          trigger={
            <Button variant="outline" size="sm">
              <Share2 className="size-4" />
              Share
            </Button>
          }
        />
      </div>

      <DynamicAppRenderer
        definition={app.definition}
        appId={app.id}
        runtimeState={app.runtimeState}
        interactive
      />
    </div>
  );
}
