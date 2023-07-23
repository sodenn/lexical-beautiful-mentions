import { useConfiguration } from "./ConfigurationProvider";
import { cn } from "./cn";

export function Placeholder() {
  const { combobox } = useConfiguration();
  return (
    <div
      className={cn(
        "pointer-events-none absolute inline-block select-none overflow-hidden overflow-ellipsis text-gray-500 dark:text-gray-400",
        combobox && "left-[14px] top-[18px]",
        !combobox && "left-3 top-4",
      )}
    >
      Enter some plain text...
    </div>
  );
}
