import { cn } from "@/lib/utils";
import {
  BeautifulMentionsComboboxItemProps,
  BeautifulMentionsComboboxProps,
} from "lexical-beautiful-mentions";
import { forwardRef } from "react";
import Fade from "./Fade";

/**
 * Combobox component for the BeautifulMentionsPlugin.
 */
export const Combobox = forwardRef<any, BeautifulMentionsComboboxProps>(
  ({ optionType, loading, ...other }, ref) => {
    if (loading) {
      return (
        <Fade>
          <div
            ref={ref}
            className="h-full overflow-hidden rounded-b bg-popover p-3 text-sm text-popover-foreground"
          >
            <div className="">Loading...</div>
          </div>
        </Fade>
      );
    }
    return (
      <Fade in={true}>
        <ul
          ref={ref}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="m-0 mt-1 h-full list-none overflow-scroll overflow-y-scroll rounded-b bg-popover p-0 text-popover-foreground"
          {...other}
        />
      </Fade>
    );
  },
);
Combobox.displayName = "Combobox";

/**
 * ComboboxItem component for the BeautifulMentionsPlugin.
 */
export const ComboboxItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsComboboxItemProps
>(({ selected, item, ...props }, ref) => (
  <>
    {item.data.dividerTop && (
      <div className="p-1">
        <div className="flex border-b border-muted" />
      </div>
    )}
    <li
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
        selected && "bg-accent text-accent-foreground",
      )}
      {...props}
    />
  </>
));
ComboboxItem.displayName = "ComboboxItem";
