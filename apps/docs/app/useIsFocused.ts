import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { BLUR_COMMAND, COMMAND_PRIORITY_NORMAL, FOCUS_COMMAND } from "lexical";
import { useLayoutEffect, useState } from "react";
import { CAN_USE_DOM } from "./environment";

export const useIsFocused = () => {
  const [editor] = useLexicalComposerContext();
  const [hasFocus, setHasFocus] = useState(() =>
    CAN_USE_DOM ? editor.getRootElement() === document.activeElement : false,
  );

  useLayoutEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setHasFocus(true);
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setHasFocus(false);
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }, [editor]);

  return hasFocus;
};
