const mentionsStyle =
  "px-1 mx-px align-baseline inline-block rounded break-words cursor-pointer select-none leading-5";
const mentionsStyleFocused =
  "outline-none shadow-md shadow-gray-500 dark:shadow-gray-900";

const theme = {
  ltr: "text-left",
  rtl: "text-right",
  beautifulMentions: {
    "@": `${mentionsStyle} dark:bg-green-500 bg-green-600 dark:text-gray-950 text-white`,
    "@Focused": mentionsStyleFocused,
    "#": `${mentionsStyle} dark:bg-blue-400 bg-blue-600 dark:text-gray-950 text-white`,
    "#Focused": mentionsStyleFocused,
    "due:": `${mentionsStyle} dark:bg-yellow-400 bg-yellow-600 dark:text-gray-950 text-white`,
    "due:Focused": mentionsStyleFocused,
    "\\w+:": `${mentionsStyle} dark:bg-gray-400 bg-gray-500 dark:text-gray-950 text-white`,
    "\\w+:Focused": mentionsStyleFocused,
  },
};

export default theme;
