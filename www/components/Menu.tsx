import { cn } from "@/lib/utils";
import {
  BeautifulMentionsMenuItemProps,
  BeautifulMentionsMenuProps,
} from "lexical-beautiful-mentions";
import { forwardRef } from "react";

/**
 * Menu component for the BeautifulMentionsPlugin.
 */
export function Menu({ loading, ...other }: BeautifulMentionsMenuProps) {
  if (loading) {
    return (
      <div className="bg-popover text-popover-foreground top-[2px] m-0 min-w-[8rem] overflow-hidden rounded-md border p-2.5 text-sm shadow-md">
        Loading...
      </div>
    );
  }
  return (
    <ul
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="bg-popover text-popover-foreground absolute top-[2px] z-1 m-0 min-w-[8rem] overflow-hidden rounded-md border p-1 whitespace-nowrap shadow-md"
      {...other}
    />
  );
}

/**
 * MenuItem component for the BeautifulMentionsPlugin.
 */
export const MenuItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsMenuItemProps
>(({ selected, item, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
      selected && "bg-accent text-accent-foreground",
    )}
    {...props}
  />
));
MenuItem.displayName = "MenuItem";
