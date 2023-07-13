import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  RangeSelection,
  TextNode,
} from "lexical";
import { startTransition, useCallback, useEffect, useState } from "react";
import {
  Menu,
  MenuOption,
  MenuRenderFn,
  MenuResolution,
  MenuTextMatch,
  useMenuAnchorRef,
} from "./Menu";

function isSelectionOnEntityBoundary(
  editor: LexicalEditor,
  offset: number
): boolean {
  if (offset !== 0) {
    return false;
  }
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();
      const prevSibling = anchorNode.getPreviousSibling();
      return $isTextNode(prevSibling) && prevSibling.isTextEntity();
    }
    return false;
  });
}

function tryGetRect(leadOffset: number, range: Range) {
  const domSelection = window.getSelection();
  if (domSelection === null || !domSelection.isCollapsed) {
    return null;
  }
  const anchorNode = domSelection.anchorNode;
  const startOffset = leadOffset;
  const endOffset = domSelection.anchorOffset;
  if (anchorNode == null || endOffset == null) {
    return null;
  }
  if (anchorNode instanceof HTMLElement) {
    return () => anchorNode.getBoundingClientRect();
  }
  try {
    range.setStart(anchorNode, startOffset);
    range.setEnd(anchorNode, endOffset);
  } catch (error) {
    return null;
  }
  return () => range.getBoundingClientRect();
}

function getTextUpToAnchor(selection: RangeSelection): string | null {
  const anchor = selection.anchor;
  if (anchor.type !== "text") {
    return null;
  }
  const anchorNode = anchor.getNode();
  if (!anchorNode.isSimpleText()) {
    return null;
  }
  const anchorOffset = anchor.offset;
  return anchorNode.getTextContent().slice(0, anchorOffset);
}

function getQueryTextForSearch(editor: LexicalEditor): string | null {
  let text = null;
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }
    text = getTextUpToAnchor(selection);
  });
  return text;
}

interface ComboboxProps<TOption extends MenuOption> {
  open: boolean;
  onClose?: () => void;
  onOpen?: (resolution: MenuResolution) => void;
  options: Array<TOption>;
  onSelectOption: (
    option: TOption,
    textNodeContainingQuery: TextNode | null,
    closeMenu: () => void
  ) => void;
  menuRenderFn: MenuRenderFn<TOption>;
  anchorClassName?: string;
}

function ComboboxPlugin<TOption extends MenuOption>(
  props: ComboboxProps<TOption>
) {
  const {
    open,
    onClose,
    onOpen,
    options,
    menuRenderFn,
    onSelectOption,
    anchorClassName,
  } = props;
  const [editor] = useLexicalComposerContext();
  const [resolution, setResolution] = useState<MenuResolution | null>(null);
  const anchorElementRef = useMenuAnchorRef(
    resolution,
    setResolution,
    anchorClassName
  );

  const closeCombobox = useCallback(() => {
    setResolution(null);
    if (onClose != null) {
      onClose();
    }
  }, [onClose]);

  const openCombobox = useCallback(
    (res: MenuResolution) => {
      setResolution(res);
      if (onOpen != null) {
        onOpen(res);
      }
    },
    [onOpen]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const ignoredKeys = [
            "ArrowUp",
            "ArrowDown",
            "Enter",
            "Escape",
            "Tab",
          ];
          if (open && !ignoredKeys.includes(event.code)) {
            closeCombobox();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          closeCombobox();
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [closeCombobox, editor, open]);

  useEffect(() => {
    if (!open || resolution != null) {
      return;
    }
    editor.getEditorState().read(() => {
      const range = document.createRange();
      const selection = $getSelection();
      const text = getQueryTextForSearch(editor) || "";
      if (
        !$isRangeSelection(selection) ||
        !selection.isCollapsed() ||
        range === null
      ) {
        closeCombobox();
        return;
      }

      const match: MenuTextMatch = {
        matchingString: "",
        replaceableString: text,
        leadOffset: text.length,
      };

      if (!isSelectionOnEntityBoundary(editor, match.leadOffset)) {
        const getRect = tryGetRect(match.leadOffset, range);
        if (getRect) {
          startTransition(() =>
            openCombobox({
              getRect,
              match,
            })
          );
          return;
        }
      }
      closeCombobox();
    });
  }, [closeCombobox, editor, open, openCombobox, resolution]);

  return resolution === null || editor === null ? null : (
    <Menu
      options={options}
      resolution={resolution}
      menuRenderFn={menuRenderFn}
      onSelectOption={onSelectOption}
      anchorElementRef={anchorElementRef}
      editor={editor}
      close={closeCombobox}
      shouldSplitNodeWithQuery
    />
  );
}

export default ComboboxPlugin;
