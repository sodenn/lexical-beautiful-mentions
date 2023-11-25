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
  COPY_COMMAND,
  GridSelection,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  ElementType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BeautifulMentionsItemData,
  BeautifulMentionComponentProps as CustomBeautifulMentionComponentProps,
} from "./BeautifulMentionsPluginProps";
import { $isBeautifulMentionNode } from "./MentionNode";
import { IS_IOS } from "./environment";
import { getNextSibling, getPreviousSibling } from "./mention-utils";
import { BeautifulMentionsThemeValues } from "./theme";

interface BeautifulMentionComponentProps {
  nodeKey: NodeKey;
  trigger: string;
  value: string;
  data?: { [p: string]: BeautifulMentionsItemData };
  component?: ElementType<CustomBeautifulMentionComponentProps> | null;
  className?: string;
  classNameFocused?: string;
  themeValues?: BeautifulMentionsThemeValues;
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
    themeValues,
    nodeKey,
    component: Component,
  } = props;
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const isFocused = $isNodeSelection(selection) && isSelected;
  const ref = useRef<any>(null);
  const mention = trigger + value;

  const finalClasses = useMemo(() => {
    if (className) {
      const classes = [className];
      if (isFocused && classNameFocused) {
        classes.push(classNameFocused);
      }
      return classes.join(" ").trim() || undefined;
    }
    return "";
  }, [isFocused, className, classNameFocused]);

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
        setSelected(!isSelected);
        return true;
      }
      return false;
    },
    [isSelected, clearSelection, setSelected],
  );

  const onBlur = useCallback(() => {
    if (isFocused) {
      $setSelection(null);
      return true;
    }
    return false;
  }, [isFocused]);

  // Make sure that the focus is removed when clicking next to the mention
  const onSelectionChange = useCallback(() => {
    if (IS_IOS && isSelected) {
      setSelected(false);
      return true;
    }
    return false;
  }, [isSelected, setSelected]);

  const onCopy = useCallback(() => {
    if (isSelected) {
      const node = $getNodeByKey(nodeKey);
      if (!node || !node.isSelected()) {
        return false;
      }
      const text = node.getTextContent();
      if (text) {
        navigator.clipboard.writeText(text);
      }
    }
    return false;
  }, [isSelected, nodeKey]);

  useEffect(() => {
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
      editor.registerCommand(COPY_COMMAND, onCopy, COMMAND_PRIORITY_LOW),
      editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        onSelectionChange,
        COMMAND_PRIORITY_LOW,
      ),
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    editor,
    onArrowLeftPress,
    onArrowRightPress,
    onClick,
    onBlur,
    onDelete,
    onSelectionChange,
  ]);

  if (Component) {
    return (
      <Component
        ref={ref}
        trigger={trigger}
        value={value}
        data={data}
        className={finalClasses}
        data-beautiful-mention={mention}
      >
        {mention}
      </Component>
    );
  }

  if (themeValues) {
    return (
      <span
        ref={ref}
        className={
          isFocused && !!themeValues.containerFocused
            ? themeValues.containerFocused
            : themeValues.container
        }
        data-beautiful-mention={mention}
      >
        <span className={themeValues.trigger}>{trigger}</span>
        <span className={themeValues.value}>{value}</span>
      </span>
    );
  }

  return (
    <span ref={ref} className={finalClasses} data-beautiful-mention={mention}>
      {mention}
    </span>
  );
}
