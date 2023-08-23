import { BeautifulMentionComponentProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";

const CustomMentionComponent = forwardRef<
  HTMLDivElement,
  BeautifulMentionComponentProps
>(({ trigger, value, children, ...other }, ref) => {
  return (
    <div {...other} ref={ref} title={trigger + value}>
      {value}
    </div>
  );
});
CustomMentionComponent.displayName = "CustomMentionComponent";

export default CustomMentionComponent;
