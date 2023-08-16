import { cn } from "@/lib/utils";
import {
  BeautifulMentionsComboboxItemProps,
  BeautifulMentionsComboboxProps,
} from "lexical-beautiful-mentions";
import { forwardRef } from "react";
import Fade from "./Fade";

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
          className="m-0 h-full list-none overflow-scroll overflow-y-scroll rounded-b bg-popover p-0 text-popover-foreground"
          {...other}
        />
      </Fade>
    );
  },
);
Combobox.displayName = "Combobox";

export const ComboboxItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsComboboxItemProps
>(({ selected, item, ...props }, ref) => (
  <>
    {item.data.dividerTop && (
      <div className="py-1">
        <div className="flex border-b border-slate-500" />
      </div>
    )}
    <li
      ref={ref}
      className={cn(
        "mx-1.5 flex min-w-[150px] shrink-0 cursor-pointer flex-row content-center whitespace-nowrap rounded border-0 px-2.5 py-1.5 leading-4 text-slate-950 outline-none last:mb-1 last:scroll-mb-1 dark:text-slate-300",
        selected
          ? "bg-gray-200 dark:bg-gray-700"
          : "bg-slate-300 dark:bg-slate-600",
      )}
      {...props}
    />
  </>
));
ComboboxItem.displayName = "ComboboxItem";
