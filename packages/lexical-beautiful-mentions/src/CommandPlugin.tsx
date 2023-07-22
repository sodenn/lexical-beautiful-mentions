import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
  RangeSelection,
  TextNode,
} from "lexical";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import {
  $splitNodeContainingQuery,
  MenuOption,
  MenuTextMatch,
  TriggerFn,
} from "./Menu";
import { insertMention } from "./mention-commands";
import { useIsFocused } from "./useIsFocused";

interface CommandPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      "commandComponent" | "commandItemComponent"
    >,
    Required<Pick<BeautifulMentionsPluginProps, "punctuation">> {
  triggerFn: TriggerFn;
  onSelectOption: (
    option: MenuOption,
    textNodeContainingQuery: TextNode | null,
  ) => void;
  onQueryChange: (matchingString: string | null) => void;
  queryString: string | null;
  options: MenuOption[];
  triggers: string[];
  creatable: boolean | string;
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

export function useAnchorRef(): MutableRefObject<HTMLElement> {
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const ref = useRef<HTMLElement>(document.createElement("div"));

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setRootElement(rootElement);
    });
  }, [editor]);

  useEffect(() => {
    const parent = rootElement?.parentElement;
    if (!parent) {
      return;
    }
    const { width } = parent.getBoundingClientRect();
    const ele = ref.current;
    ele.style.position = "absolute";
    ele.style.width = `${width}px`;
    parent.appendChild(ele);
    return () => {
      parent.removeChild(ele);
    };
  }, [rootElement]);

  useEffect(() => {
    const parent = rootElement?.parentElement;
    if (!parent) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      console.log(entry.contentRect.height);
      if (ref.current) {
        ref.current.style.width = `${entry.contentRect.width}px`;
      }
    });
    resizeObserver.observe(parent);
    return () => {
      resizeObserver.disconnect();
    };
  }, [rootElement]);

  return ref;
}

export function CommandPlugin(props: CommandPluginProps) {
  const {
    queryString,
    onSelectOption,
    triggers,
    punctuation,
    creatable,
    triggerFn,
    onQueryChange,
    options,
    commandComponent: CommandComponent = "div",
    commandItemComponent: CommandItemComponent = "div",
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const anchor = useAnchorRef();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [match, setMatch] = useState<MenuTextMatch | null>(null);
  const [text, setText] = useState<string | null>(null);

  const handleArrowKeyDown = useCallback(
    (event: KeyboardEvent, direction: "up" | "down") => {
      if (!focused) {
        return false;
      }
      const optionsLength =
        options.length === 0 ? triggers.length - 1 : options.length - 1;
      const newSelectedIndex =
        direction === "down"
          ? selectedIndex < optionsLength
            ? selectedIndex + 1
            : 0
          : selectedIndex > 0
          ? selectedIndex - 1
          : optionsLength;
      setSelectedIndex(newSelectedIndex);
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    },
    [focused, options.length, selectedIndex, triggers.length],
  );

  const cleanup = useCallback(() => {
    setMatch(null);
    setSelectedIndex(0);
    onQueryChange(null);
    setText(null);
  }, [onQueryChange]);

  const handleSelectOption = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      const option = options[index];
      editor.update(() => {
        const textNode = match ? $splitNodeContainingQuery(match) : null;
        onSelectOption(option, textNode);
      });
      cleanup();
    },
    [cleanup, editor, match, onSelectOption, options],
  );

  const handleSelectTrigger = useCallback(
    (index: number) => {
      const trigger = triggers[index];
      editor.update(() => {
        insertMention(triggers, punctuation, trigger);
      });
      cleanup();
    },
    [editor, punctuation, triggers, cleanup],
  );

  const handleKeySelect = useCallback(
    (event: KeyboardEvent) => {
      let handled = false;
      if (focused && options.length === 0) {
        handled = true;
        handleSelectTrigger(selectedIndex);
      }
      if (focused && options.length > 0) {
        handled = true;
        handleSelectOption(selectedIndex);
      }
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return handled;
    },
    [
      focused,
      handleSelectOption,
      handleSelectTrigger,
      options.length,
      selectedIndex,
    ],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          return handleArrowKeyDown(event, "down");
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          return handleArrowKeyDown(event, "up");
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ENTER_COMMAND,
        handleKeySelect,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_TAB_COMMAND,
        handleKeySelect,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, handleArrowKeyDown, handleKeySelect]);

  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const text = getQueryTextForSearch(editor);
        if (!text) {
          setMatch(null);
          setText(null);
          return;
        }
        setText(text.trim());
        const match = triggerFn(text, editor);
        setMatch(match);
        onQueryChange(match ? match.matchingString : null);
      });
    };
    const removeUpdateListener = editor.registerUpdateListener(updateListener);
    return () => {
      removeUpdateListener();
    };
  }, [editor, triggerFn, onQueryChange]);

  if (!focused || !anchor) {
    return null;
  }

  return (
    <>
      {ReactDOM.createPortal(
        <CommandComponent open={focused}>
          {options.length === 0 &&
            triggers
              .filter((t) => !text || t.includes(text))
              .map((trigger, index) => (
                <CommandItemComponent
                  key={trigger}
                  label={trigger}
                  onClick={() => handleSelectTrigger(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  selected={index === selectedIndex}
                >
                  {trigger}
                </CommandItemComponent>
              ))}
          {options.length > 0 &&
            options.map((option, index) => (
              <CommandItemComponent
                key={option.key}
                label={option.label}
                onClick={() => handleSelectOption(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                selected={index === selectedIndex}
              >
                {option.label}
              </CommandItemComponent>
            ))}
        </CommandComponent>,
        anchor.current!,
      )}
    </>
  );
}
