import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
  RangeSelection,
  TextNode,
} from "lexical";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Menu,
  MenuRenderFn,
  MenuResolution,
  TriggerFn,
  useMenuAnchorRef,
} from "./Menu";

export class TypeaheadOption {
  key: string;
  ref?: MutableRefObject<HTMLElement | null>;

  constructor(key: string) {
    this.key = key;
    this.ref = { current: null };
    this.setRefElement = this.setRefElement.bind(this);
  }

  setRefElement(element: HTMLElement | null) {
    this.ref = { current: element };
  }
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

function tryToPositionRange(leadOffset: number, range: Range): boolean {
  const domSelection = window.getSelection();
  if (domSelection === null || !domSelection.isCollapsed) {
    return false;
  }
  const anchorNode = domSelection.anchorNode;
  const startOffset = leadOffset;
  const endOffset = domSelection.anchorOffset;

  if (anchorNode == null || endOffset == null) {
    return false;
  }

  try {
    range.setStart(anchorNode, startOffset);
    range.setEnd(anchorNode, endOffset);
  } catch (error) {
    return false;
  }

  return true;
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

function isSelectionOnEntityBoundary(
  editor: LexicalEditor,
  offset: number,
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

function startTransition(callback: () => void) {
  if (React.startTransition) {
    React.startTransition(callback);
  } else {
    callback();
  }
}

export type TypeaheadMenuPluginProps<TOption extends TypeaheadOption> = {
  onQueryChange: (matchingString: string | null) => void;
  onSelectOption: (
    option: TOption,
    textNodeContainingQuery: TextNode | null,
    closeMenu: () => void,
    matchingString: string,
  ) => void;
  options: Array<TOption>;
  menuRenderFn: MenuRenderFn<TOption>;
  triggerFn: TriggerFn;
  onOpen?: (resolution: MenuResolution) => void;
  onClose?: () => void;
  anchorClassName?: string;
};

export function TypeaheadMenuPlugin<TOption extends TypeaheadOption>({
  options,
  onQueryChange,
  onSelectOption,
  onOpen,
  onClose,
  menuRenderFn,
  triggerFn,
  anchorClassName,
}: TypeaheadMenuPluginProps<TOption>): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [resolution, setResolution] = useState<MenuResolution | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const anchorElementRef = useMenuAnchorRef({
    resolution,
    setResolution,
    className: anchorClassName,
    menuVisible,
  });

  const closeTypeahead = useCallback(() => {
    setResolution(null);
    if (onClose != null && resolution !== null) {
      onClose();
    }
  }, [onClose, resolution]);

  const openTypeahead = useCallback(
    (res: MenuResolution) => {
      setResolution(res);
      if (onOpen != null && resolution === null) {
        onOpen(res);
      }
    },
    [onOpen, resolution],
  );

  useEffect(() => {
    if (resolution === null && menuVisible) {
      setMenuVisible(false);
    }
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const range = document.createRange();
        const selection = $getSelection();
        const text = getQueryTextForSearch(editor);

        if (
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          text === null ||
          range === null
        ) {
          closeTypeahead();
          return;
        }

        const match = triggerFn(text, editor);
        onQueryChange(match ? match.matchingString : null);

        if (
          match !== null &&
          !isSelectionOnEntityBoundary(editor, match.leadOffset)
        ) {
          const isRangePositioned = tryToPositionRange(match.leadOffset, range);
          if (isRangePositioned !== null) {
            startTransition(() =>
              openTypeahead({
                getRect: () => range.getBoundingClientRect(),
                match,
              }),
            );
            return;
          }
        }
        closeTypeahead();
      });
    };

    const removeUpdateListener = editor.registerUpdateListener(updateListener);

    return () => {
      removeUpdateListener();
    };
  }, [
    editor,
    triggerFn,
    onQueryChange,
    resolution,
    closeTypeahead,
    openTypeahead,
    menuVisible,
    setMenuVisible,
  ]);

  return resolution === null || editor === null ? null : (
    <Menu
      close={closeTypeahead}
      resolution={resolution}
      editor={editor}
      anchorElementRef={anchorElementRef}
      options={options}
      menuRenderFn={menuRenderFn}
      onSelectOption={onSelectOption}
      onMenuVisibilityChange={setMenuVisible}
      shouldSplitNodeWithQuery
    />
  );
}
