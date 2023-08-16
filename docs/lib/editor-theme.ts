import { BeautifulMentionsTheme } from "lexical-beautiful-mentions";

const mentionsStyle =
  "px-1 mx-px align-baseline inline-block rounded break-words cursor-pointer select-none leading-5";
const mentionsStyleFocused = "outline-none shadow-md shadow-primary/40";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": `${mentionsStyle} dark:bg-green-500 bg-green-600 text-accent`,
  "@Focused": mentionsStyleFocused,
  "#": `${mentionsStyle} dark:bg-blue-400 bg-blue-600 text-accent`,
  "#Focused": mentionsStyleFocused,
  "due:": `${mentionsStyle} dark:bg-yellow-400 bg-yellow-600 text-accent`,
  "due:Focused": mentionsStyleFocused,
  // 👇 use a configuration object if you need to apply different styles to trigger and value
  "rec:": {
    trigger: "text-blue-500",
    value: "text-orange-500",
    container: "mx-[2px] px-[4px] rounded border border-muted cursor-pointer",
    containerFocused:
      "mx-[2px] px-[4px] rounded border border-muted cursor-pointer",
  },
  "\\w+:": `${mentionsStyle} dark:bg-gray-400 bg-gray-500 text-accent`,
  "\\w+:Focused": mentionsStyleFocused,
};

const theme = {
  ltr: "text-left",
  rtl: "text-right",
  beautifulMentions: beautifulMentionsTheme,
};

export default theme;
