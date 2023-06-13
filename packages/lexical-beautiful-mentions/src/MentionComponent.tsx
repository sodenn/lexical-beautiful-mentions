import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isNodeSelection,
  $isTextNode,
  $setSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
  NodeSelection,
  RangeSelection,
} from "lexical";
import React, { useCallback, useMemo, useState } from "react";
import { $isBeautifulMentionNode } from "./MentionNode";

interface BeautifulMentionComponentProps {
  mention: string;
  nodeKey: NodeKey;
  className?: string;
  classNameFocused?: string;
}

export default function BeautifulMentionComponent(
  props: BeautifulMentionComponentProps
) {
  const { mention, className = "", classNameFocused = "", nodeKey } = props;
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const isFocused = $isNodeSelection(selection) && isSelected;
  const ref = React.useRef(null);

  const classNameFinal = useMemo(() => {
    const classes = [className];
    if (isFocused) {
      classes.push(classNameFocused);
    }
    return classes.join(" ").trim() || undefined;
  }, [className, classNameFocused, isFocused]);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isBeautifulMentionNode(node)) {
          node.remove();
        }
        setSelected(false);
      }
      return false;
    },
    [isSelected, nodeKey, setSelected]
  );

  const onArrowLeftPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = node.getPreviousSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectEnd();
        handled = true;
      }
      if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select();
        handled = true;
      }
      if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectNext();
        handled = true;
      }
      if (nodeToSelect === null) {
        node.selectPrevious();
        handled = true;
      }
      if (handled) {
        event.preventDefault();
      }
      return handled;
    },
    [nodeKey]
  );

  const onArrowRightPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = node.getNextSibling();
      if ($isElementNode(nodeToSelect)) {
        nodeToSelect.selectStart();
        handled = true;
      }
      if ($isTextNode(nodeToSelect)) {
        nodeToSelect.select(0, 0);
        handled = true;
      }
      if ($isDecoratorNode(nodeToSelect)) {
        nodeToSelect.selectPrevious();
        handled = true;
      }
      if (nodeToSelect === null) {
        node.selectNext();
        handled = true;
      }
      if (handled) {
        event.preventDefault();
      }
      return handled;
    },
    [nodeKey]
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (event.target === ref.current) {
        if (!event.shiftKey) {
          clearSelection();
        }
        setSelected(!isSelected);
        return true;
      }
      return false;
    },
    [isSelected, clearSelection, setSelected]
  );

  const onBlur = useCallback(() => {
    if (isFocused) {
      $setSelection(null);
      return true;
    }
    return false;
  }, [isFocused]);

  React.useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        onArrowLeftPress,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        onArrowRightPress,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_LOW)
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [editor, onArrowLeftPress, onArrowRightPress, onClick, onBlur, onDelete]);

  return (
    <span ref={ref} className={classNameFinal} data-beautiful-mention={mention}>
      {mention}
    </span>
  );
}
