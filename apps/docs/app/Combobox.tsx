import { BeautifulMentionsComboboxProps } from "lexical-beautiful-mentions";
import { forwardRef } from "react";
import Fade from "./Fade";

const Combobox = forwardRef<any, BeautifulMentionsComboboxProps>(
  ({ optionType, loading, ...other }, ref) => {
    if (loading) {
      return (
        <Fade>
          <div
            ref={ref}
            className="h-full overflow-hidden rounded-b-lg bg-slate-300 text-slate-950 dark:bg-slate-600 dark:text-slate-300"
          >
            <div className="mx-2 mb-3 mt-2">Loading...</div>
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
          className="m-0 h-full list-none overflow-scroll overflow-y-scroll rounded-b-lg bg-slate-300 p-0 dark:bg-slate-600"
          {...other}
        />
      </Fade>
    );
  },
);
Combobox.displayName = "Combobox";

export default Combobox;
