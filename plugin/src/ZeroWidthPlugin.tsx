import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  LineBreakNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { SerializedLexicalNode } from "lexical/LexicalNode";
import React from "react";
import {
  $createZeroWidthNode,
  $isZeroWidthNode,
  ZeroWidthNode,
} from "./ZeroWidthNode";

export const ZERO_WIDTH_CHARACTER = "​"; // zero-width space (U+200B)

interface SerializedNode extends SerializedLexicalNode {
  children?: Array<SerializedNode>;
}

/**
 * Removes all zero-width nodes from the given node and its children.
 */
export function removeZeroWidthNodes<T extends SerializedNode>(node: T): T {
  if (node.children) {
    node.children = node.children.filter((child) => {
      if (child.type === "zeroWidth") {
        return false;
      }
      removeZeroWidthNodes(child);
      return true;
    });
  }
  return node;
}

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
        editor.update(
          () => {
            const root = $getRoot();
            const last = root.getLastDescendant();
            // add ZeroWidthNode at the end of the editor
            if ($isDecoratorNode(last)) {
              $nodesOfType(ZeroWidthNode).forEach((node) => node.remove()); // cleanup
              last.insertAfter($createZeroWidthNode());
            }
            // add ZeroWidthNode before each line break
            $nodesOfType(LineBreakNode).forEach((node) => {
              const prev = node.getPreviousSibling();
              if ($isDecoratorNode(prev)) {
                node.insertBefore($createZeroWidthNode());
              }
            });
          },
          // merge with previous history entry to allow undoing
          { tag: "history-merge" },
        );
      }),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          // prevent the unnecessary removal of the zero-width space, since this
          // would lead to the insertion of another zero-width space and thus break
          // undo with Ctrl+z
          if (event.ctrlKey || event.metaKey || event.altKey) {
            return false;
          }
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
        COMMAND_PRIORITY_HIGH,
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
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor]);

  return null;
}
