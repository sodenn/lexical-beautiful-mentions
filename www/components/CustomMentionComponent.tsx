import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { BeautifulMentionComponentProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";

const CustomMentionComponent = forwardRef<
  HTMLSpanElement,
  BeautifulMentionComponentProps<{ id: string }>
>(({ trigger, value, data, children, ...other }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span {...other} ref={ref}>
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Trigger: <code>{trigger}</code>
        </p>
        <p>
          Value: <code>{value}</code>
        </p>
        {data?.id && (
          <p>
            ID: <code>{data.id}</code>
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

export default CustomMentionComponent;
