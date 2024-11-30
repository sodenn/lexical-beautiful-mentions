import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isDecoratorNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  ParagraphNode,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import {
  $createPlaceholderNode,
  $isPlaceholderNode,
  PlaceholderNode,
} from "./PlaceholderNode";
import { $nodesOfType } from "./mention-utils";

/**
 * This plugin serves as a patch to fix an incorrect cursor position in Safari.
 * {@link https://github.com/facebook/lexical/issues/4487}.
 */
export function PlaceholderPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([PlaceholderNode])) {
      throw new Error(
        "BeautifulMentionsPlugin: PlaceholderNode not registered on editor",
      );
    }
    return mergeRegister(
      editor.registerUpdateListener(() => {
        editor.update(
          () => {
            // insert a placeholder node at the end of each paragraph if the
            // last node is a decorator node.
            const placeholderNodes = $nodesOfType(PlaceholderNode);
            $nodesOfType(ParagraphNode).forEach((paragraph) => {
              const paragraphPlaceholders = placeholderNodes.filter((p) =>
                paragraph.isParentOf(p),
              );
              const lastNode = paragraph.getLastDescendant();
              if ($isDecoratorNode(lastNode)) {
                paragraphPlaceholders.forEach((p) => {
                  p.remove();
                });
                lastNode.insertAfter($createPlaceholderNode());
              } else if (
                $isPlaceholderNode(lastNode) &&
                !$isDecoratorNode(lastNode.getPreviousSibling())
              ) {
                paragraphPlaceholders.forEach((p) => {
                  p.remove();
                });
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
          // prevent unnecessary removal of the placeholder nodes, since this
          // would lead to insertion of another placeholder node and thus break
          // undo with Ctrl+z
          if (
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.key === "Shift"
          ) {
            return false;
          }
          // if the user starts typing at the placeholder's position, remove
          // the placeholder node. this makes the PlaceholderNode almost
          // "invisible" and prevents issues when, for example, when checking
          // for previous nodes in the code.
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const [node] = selection.getNodes();
            if ($isPlaceholderNode(node)) {
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
          // user tries to insert a node directly after the PlaceholderNode
          const selection = $getSelection();
          if ($isRangeSelection(selection) && selection.isCollapsed()) {
            const [node] = selection.getNodes();
            if ($isPlaceholderNode(node)) {
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
