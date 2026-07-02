"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { SlashCommandItem } from "@/lib/notes/slash-command-types";
import { cn } from "@/lib/utils";

type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export type SlashCommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>(function SlashCommandList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded border-2 border-border bg-background p-2 font-sans text-sm text-muted-foreground shadow-md">
        No results
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto rounded border-2 border-border bg-background p-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={cn(
            "flex w-full flex-col items-start rounded px-2 py-1.5 text-left transition-colors",
            index === selectedIndex
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted/60",
          )}
          onClick={() => command(item)}
        >
          <span className="font-head text-sm">{item.title}</span>
          <span
            className={cn(
              "font-sans text-xs",
              index === selectedIndex
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );
});
