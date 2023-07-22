import { BeautifulMentionsComboboxItemProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";
import { cn } from "./cn";

const ComboboxItem = forwardRef<
  HTMLLIElement,
  BeautifulMentionsComboboxItemProps
>(({ selected, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      "mx-1.5 flex min-w-[150px] shrink-0 cursor-pointer flex-row content-center whitespace-nowrap rounded border-0 px-2.5 py-1.5 leading-4 text-slate-950 outline-none last:mb-1 last:scroll-mb-1 dark:text-slate-300",
      selected
        ? "bg-gray-100 dark:bg-gray-700"
        : "bg-slate-300 dark:bg-slate-600",
    )}
    {...props}
  />
));
ComboboxItem.displayName = "ComboboxItem";

export default ComboboxItem;
