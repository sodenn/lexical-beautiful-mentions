import { BeautifulMentionsMenuItemProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";

const MenuItem = forwardRef<HTMLLIElement, BeautifulMentionsMenuItemProps>(
  ({ selected, ...props }, ref) => (
    <li
      ref={ref}
      className={`m-0 flex min-w-[150px] shrink-0 cursor-pointer flex-row content-center whitespace-nowrap border-0 px-2.5 py-2 leading-4 text-slate-950 outline-none first:mt-1.5 last:mb-1.5 dark:text-slate-300 ${
        selected ? "bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-900"
      }`}
      {...props}
    />
  )
);
MenuItem.displayName = "MenuItem";

export default MenuItem;
