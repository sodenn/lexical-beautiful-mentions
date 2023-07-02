import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import React from "react";
import { $createZeroWidthNode, $isZeroWidthNode } from "./ZeroWidthNode";

/**
 * This plugin serves as a patch to fix an incorrect cursor position in Safari.
 * It also ensures that the cursor is correctly aligned with the line height in
 * all browsers.
 * {@link https://github.com/facebook/lexical/issues/4487}.
 */
export function ZeroWidthPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        // add a zero-width space node at the end if the last node is a decorator node
        editor.update(() => {
          const root = $getRoot();
          const last = root.getLastDescendant();
          if ($isDecoratorNode(last)) {
            last.insertAfter($createZeroWidthNode());
          }
        });
      }),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        () => {
          // remove the zero-width space if the user starts typing
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isZeroWidthNode(node)) {
              node.remove();
            }
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          // select the previous node to avoid an error that occurs when the
          // user tries to insert a node directly after the zero-width space
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            if ($isZeroWidthNode(node)) {
              node.selectPrevious();
            }
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor]);

  return null;
}
