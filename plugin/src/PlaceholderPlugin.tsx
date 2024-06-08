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
import { useEffect } from "react";
import {
  $createPlaceholderNode,
  $isPlaceholderNode,
  PlaceholderNode,
} from "./PlaceholderNode";

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
            const root = $getRoot();
            const last = root.getLastDescendant();
            // add PlaceholderNode at the end of the editor
            if ($isDecoratorNode(last)) {
              $nodesOfType(PlaceholderNode).forEach((node) => node.remove()); // cleanup
              last.insertAfter($createPlaceholderNode());
            }
            // add PlaceholderNode before each line break
            $nodesOfType(LineBreakNode).forEach((node) => {
              const prev = node.getPreviousSibling();
              if ($isDecoratorNode(prev)) {
                node.insertBefore($createPlaceholderNode());
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
          // prevent the unnecessary removal of the PlaceholderNode, since this
          // would lead to the insertion of another PlaceholderNode and thus break
          // undo with Ctrl+z
          if (event.ctrlKey || event.metaKey || event.altKey) {
            return false;
          }
          // remove the PlaceholderNode if the user starts typing
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
