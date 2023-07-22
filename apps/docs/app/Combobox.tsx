import { BeautifulMentionsComboboxProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";
import Fade from "./Fade";

const Combobox = forwardRef<any, BeautifulMentionsComboboxProps>(
  ({ ...other }, ref) => {
    return (
      <Fade in={true}>
        <ul
          ref={ref}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="m-0 h-full list-none overflow-scroll overflow-y-scroll rounded-b-lg bg-slate-300 p-0 dark:bg-slate-600"
          {...other}
        />
      </Fade>
    );
  },
);
Combobox.displayName = "Combobox";

export default Combobox;
