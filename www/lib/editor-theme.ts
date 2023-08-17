import { BeautifulMentionsTheme } from "lexical-beautiful-mentions";

const mentionsStyle =
  "px-1 mx-px align-baseline inline-block rounded break-words cursor-pointer select-none leading-5";
const mentionsStyleFocused = "outline-none shadow-md";

const beautifulMentionsTheme: BeautifulMentionsTheme = {
  "@": `${mentionsStyle} dark:bg-green-500 bg-green-600 text-accent`,
  "@Focused": `${mentionsStyleFocused} dark:shadow-green-400/50 shadow-green-600/50`,
  "#": `${mentionsStyle} dark:bg-blue-400 bg-blue-600 text-accent`,
  "#Focused": `${mentionsStyleFocused} dark:shadow-blue-400/50 shadow-blue-600/50`,
  "due:": `${mentionsStyle} dark:bg-yellow-400 bg-yellow-600 text-accent`,
  "due:Focused": `${mentionsStyleFocused} dark:shadow-yellow-400/50 shadow-yellow-600/50`,
  // 👇 use a configuration object if you need to apply different styles to trigger and value
  "rec:": {
    trigger: "text-blue-500",
    value: "text-orange-500",
    container: "mx-[2px] px-[4px] rounded border border-muted cursor-pointer",
    containerFocused:
      "mx-[2px] px-[4px] rounded border border-muted cursor-pointer",
  },
  "\\w+:": `${mentionsStyle} dark:bg-gray-400 bg-gray-500 text-accent`,
  "\\w+:Focused": `${mentionsStyleFocused} dark:shadow-gray-400/50 shadow-gray-500/50`,
};

const theme = {
  ltr: "text-left",
  rtl: "text-right",
  beautifulMentions: beautifulMentionsTheme,
};

export default theme;
