import { useConfiguration } from "@/components/ConfigurationProvider";
import { cn } from "@/lib/utils";

export function Placeholder() {
  const { combobox } = useConfiguration();
  return (
    <div
      className={cn(
        "pointer-events-none absolute inline-block select-none overflow-hidden overflow-ellipsis text-muted-foreground",
        combobox && "left-[14px] top-[18px]",
        !combobox && "left-3 top-4",
      )}
    >
      Enter some plain text...
    </div>
  );
}
