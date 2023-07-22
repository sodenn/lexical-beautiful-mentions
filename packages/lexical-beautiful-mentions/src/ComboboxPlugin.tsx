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
import { useCallback, useEffect, useRef, useState } from "react";
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

interface ComboboxPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      "comboboxComponent" | "comboboxItemComponent"
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

function filterTriggers(triggers: string[], text: string | null) {
  if (!text || triggers.every((t) => !t.startsWith(text))) {
    return triggers;
  }
  return triggers.filter((t) => t.startsWith(text));
}

export function useAnchorRef(render: boolean) {
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const minHeight = useRef<number>(0);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      setRootElement(rootElement);
    });
  }, [editor]);

  useEffect(() => {
    const parent = rootElement?.parentElement;
    if (!render && parent && anchor && parent.contains(anchor)) {
      parent.removeChild(anchor);
      setAnchor(null);
    }
  }, [anchor, render, rootElement?.parentElement]);

  useEffect(() => {
    const parent = rootElement?.parentElement;
    if (!parent || !render) {
      return;
    }
    const { width } = parent.getBoundingClientRect();
    const element = anchor || document.createElement("div");
    if (!anchor) {
      setAnchor(element);
    }
    element.style.position = "absolute";
    element.style.width = `${width}px`;
    parent.appendChild(element);
    return () => {
      parent.removeChild(element);
    };
  }, [rootElement, render, anchor]);

  useEffect(() => {
    const parent = rootElement?.parentElement;
    if (!parent) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (anchor) {
        anchor.style.width = `${entry.contentRect.width}px`;
      }
    });
    resizeObserver.observe(parent);
    return () => {
      resizeObserver.disconnect();
    };
  }, [anchor, rootElement]);

  useEffect(() => {
    if (!anchor) {
      return;
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      console.log(entry);
      if (entry.contentRect.height > minHeight.current) {
        minHeight.current = entry.contentRect.height;
        anchor.style.minHeight = `${minHeight.current}px`;
        anchor.style.height = `1px`;
      }
    });
    resizeObserver.observe(anchor);
    return () => {
      resizeObserver.disconnect();
    };
  }, [anchor]);

  return anchor;
}

export function ComboboxPlugin(props: ComboboxPluginProps) {
  const {
    queryString,
    onSelectOption,
    triggers,
    punctuation,
    creatable,
    triggerFn,
    onQueryChange,
    options,
    comboboxComponent: ComboboxComponent = "div",
    comboboxItemComponent: ComboboxItemComponent = "div",
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const anchor = useAnchorRef(focused);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [match, setMatch] = useState<MenuTextMatch | null>(null);
  const [text, setText] = useState<string | null>(null);
  const itemRef = useRef<Record<string, HTMLElement | null>>({});

  const scrollIntoView = useCallback(
    (index: number) => {
      const items = options.length === 0 ? triggers : options;
      const item = items[index];
      const el =
        typeof item === "string"
          ? itemRef.current[item]
          : itemRef.current[item.key];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    },
    [options, triggers],
  );

  const handleArrowKeyDown = useCallback(
    (event: KeyboardEvent, direction: "up" | "down") => {
      if (!focused) {
        return false;
      }
      const index = selectedIndex === null ? -1 : selectedIndex;
      const length =
        options.length === 0 ? triggers.length - 1 : options.length - 1;
      const newIndex =
        direction === "down"
          ? index < length
            ? index + 1
            : 0
          : index > 0
          ? index - 1
          : length;
      setSelectedIndex(newIndex);
      scrollIntoView(newIndex);
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    },
    [focused, options.length, selectedIndex, triggers.length, scrollIntoView],
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      scrollIntoView(index);
    },
    [scrollIntoView],
  );

  const handleMouseLeave = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const cleanup = useCallback(() => {
    setMatch(null);
    onQueryChange(null);
    setText(null);
  }, [onQueryChange]);

  const handleSelectOption = useCallback(
    (index: number) => {
      const option = options[index];
      editor.update(() => {
        const textNode = match ? $splitNodeContainingQuery(match) : null;
        onSelectOption(option, textNode);
      });
      cleanup();
      setSelectedIndex(null);
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
      if (!focused || selectedIndex === null) {
        return false;
      }
      let handled = false;
      if (options.length === 0) {
        handled = true;
        handleSelectTrigger(selectedIndex);
      }
      if (options.length > 0) {
        handled = true;
        handleSelectOption(selectedIndex);
      }
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      console.log(handled);
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
        <ComboboxComponent>
          {options.length === 0 &&
            filterTriggers(triggers, text).map((trigger, index) => (
              <ComboboxItemComponent
                key={trigger}
                label={trigger}
                ref={(el: HTMLElement | null) =>
                  (itemRef.current[trigger] = el)
                }
                onClick={() => handleSelectTrigger(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onMouseDown={(e) => e.preventDefault()}
                selected={index === selectedIndex}
              >
                {trigger}
              </ComboboxItemComponent>
            ))}
          {options.length > 0 &&
            options.map((option, index) => (
              <ComboboxItemComponent
                key={option.key}
                label={option.label}
                ref={(el: HTMLElement | null) =>
                  (itemRef.current[option.key] = el)
                }
                onClick={() => handleSelectOption(index)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onMouseDown={(e) => e.preventDefault()}
                selected={index === selectedIndex}
              >
                {option.label}
              </ComboboxItemComponent>
            ))}
        </ComboboxComponent>,
        anchor,
      )}
    </>
  );
}
