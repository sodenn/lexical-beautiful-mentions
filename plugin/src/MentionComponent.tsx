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
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { ElementType, useCallback, useEffect, useMemo, useRef } from "react";
import {
  BeautifulMentionsItemData,
  BeautifulMentionComponentProps as CustomBeautifulMentionComponentProps,
} from "./BeautifulMentionsPluginProps";
import { $isBeautifulMentionNode } from "./MentionNode";
import { IS_IOS } from "./environment";
import { getNextSibling, getPreviousSibling } from "./mention-utils";
import { BeautifulMentionsCssClassNames } from "./theme";
import { useIsFocused } from "./useIsFocused";

interface BeautifulMentionComponentProps {
  nodeKey: NodeKey;
  trigger: string;
  value: string;
  data?: { [p: string]: BeautifulMentionsItemData };
  component?: ElementType<CustomBeautifulMentionComponentProps> | null;
  className?: string;
  classNameFocused?: string;
  classNames?: BeautifulMentionsCssClassNames;
}

export default function BeautifulMentionComponent(
  props: BeautifulMentionComponentProps,
) {
  const {
    value,
    trigger,
    data,
    className,
    classNameFocused,
    classNames,
    nodeKey,
    component: Component,
  } = props;
  const [editor] = useLexicalComposerContext();
  const isEditorFocused = useIsFocused();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const ref = useRef<any>(null);
  const mention = trigger + value;

  const composedClassNames = useMemo(() => {
    if (className) {
      const classes = [className];
      if (isSelected && isEditorFocused && classNameFocused) {
        classes.push(classNameFocused);
      }
      return classes.join(" ").trim() || undefined;
    }
    return "";
  }, [isSelected, className, classNameFocused, isEditorFocused]);

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isBeautifulMentionNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onArrowLeftPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = getPreviousSibling(node);
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
    [nodeKey],
  );

  const onArrowRightPress = useCallback(
    (event: KeyboardEvent) => {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isSelected()) {
        return false;
      }
      let handled = false;
      const nodeToSelect = getNextSibling(node);
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
    [nodeKey],
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (
        event.target === ref.current ||
        ref.current?.contains(event.target as Node)
      ) {
        if (!event.shiftKey) {
          clearSelection();
        }
        setSelected(true);
        return true;
      }
      return false;
    },
    [clearSelection, setSelected],
  );

  const onBlur = useCallback(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node || !node.isSelected()) {
      return false;
    }

    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
      return false;
    }

    $setSelection(null);
    return false;
  }, [nodeKey]);

  const onSelectionChange = useCallback(() => {
    if (IS_IOS && isSelected) {
      // needed to keep the cursor in the editor when clicking next to a selected mention
      setSelected(false);
      return true;
    }
    return false;
  }, [isSelected, setSelected]);

  useEffect(() => {
    const unregister = mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        onArrowLeftPress,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        onArrowRightPress,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        onSelectionChange,
        COMMAND_PRIORITY_LOW,
      ),
    );
    return () => {
      unregister();
    };
  }, [
    editor,
    onArrowLeftPress,
    onArrowRightPress,
    onClick,
    onDelete,
    onBlur,
    onSelectionChange,
  ]);

  if (Component) {
    return (
      <Component
        // @ts-ignore
        ref={ref}
        trigger={trigger}
        value={value}
        data={data}
        className={composedClassNames}
        data-beautiful-mention={mention}
      >
        {mention}
      </Component>
    );
  }

  if (classNames) {
    return (
      <span
        ref={ref}
        className={
          isSelected && !!classNames.containerFocused
            ? classNames.containerFocused
            : classNames.container
        }
        data-beautiful-mention={mention}
      >
        <span className={classNames.trigger}>{trigger}</span>
        <span className={classNames.value}>{value}</span>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={composedClassNames}
      data-beautiful-mention={mention}
    >
      {mention}
    </span>
  );
}
