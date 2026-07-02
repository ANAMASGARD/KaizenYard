"use client";

import { cn } from "@/lib/utils";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import React, { ComponentPropsWithoutRef } from "react";

const Menu = BaseMenu.Root;
const Trigger = BaseMenu.Trigger;

interface IMenuContent
  extends ComponentPropsWithoutRef<typeof BaseMenu.Popup> {
  align?: BaseMenu.Positioner.Props["align"];
  side?: BaseMenu.Positioner.Props["side"];
  sideOffset?: BaseMenu.Positioner.Props["sideOffset"];
}

const Content = ({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  ...props
}: IMenuContent) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner
      align={align}
      side={side}
      sideOffset={sideOffset}
      className="isolate z-50"
    >
      <BaseMenu.Popup
        className={cn(
          "min-w-32 rounded border-2 border-border bg-background p-1 text-foreground shadow-md",
          className,
        )}
        {...props}
      />
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
);

const MenuItem = React.forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof BaseMenu.Item>
>(({ className, ...props }, ref) => (
  <BaseMenu.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded px-2 py-1.5 font-sans text-sm outline-hidden transition-colors hover:bg-primary hover:text-primary-foreground focus:bg-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
));
MenuItem.displayName = "MenuItem";

const MenuComponent = Object.assign(Menu, {
  Trigger,
  Content,
  Item: MenuItem,
});

export { MenuComponent as Menu };
