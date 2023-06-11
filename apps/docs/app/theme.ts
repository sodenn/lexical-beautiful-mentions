const mentionsStyle =
  "px-1 mx-px align-baseline inline-block rounded break-words cursor-pointer select-none leading-5";
const mentionsStyleFocused = "outline-none shadow-md shadow-gray-900";

const theme = {
  ltr: "text-left",
  rtl: "text-right",
  beautifulMentions: {
    "@": `${mentionsStyle} bg-green-500 text-gray-950`,
    "@Focused": mentionsStyleFocused,
    "#": `${mentionsStyle} bg-blue-400 text-gray-950`,
    "#Focused": mentionsStyleFocused,
    "due:": `${mentionsStyle} bg-yellow-400 text-gray-950`,
    "due:Focused": mentionsStyleFocused,
    "\\w+:": `${mentionsStyle} bg-gray-400 text-gray-950`,
    "\\w+:Focused": mentionsStyleFocused,
  },
};

export default theme;
