import { CAN_USE_DOM } from "@/lib/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $isElementNode,
  BLUR_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  FOCUS_COMMAND,
  LexicalNode,
} from "lexical";
import { $isBeautifulMentionNode } from "lexical-beautiful-mentions";
import { useLayoutEffect, useState } from "react";

export function getDebugTextContent(node: LexicalNode): string {
  let result = "";

  if ($isElementNode(node)) {
    const children = node.getChildren();
    for (const child of children) {
      result += getDebugTextContent(child);
    }
  } else if ($isBeautifulMentionNode(node)) {
    result += "[" + node.getTextContent() + "]";
  } else {
    result += node.getTextContent();
  }

  return result;
}

export function useIsFocused() {
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
}
