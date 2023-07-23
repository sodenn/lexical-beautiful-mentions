import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
  RangeSelection,
  TextNode,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import {
  $splitNodeContainingQuery,
  MenuOption,
  MenuTextMatch,
  TriggerFn,
} from "./Menu";
import { insertMention } from "./mention-commands";
import { useDebounce } from "./useDebounce";
import { useIsFocused } from "./useIsFocused";

interface ComboboxPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      "comboboxAnchor" | "comboboxComponent" | "comboboxItemComponent"
    >,
    Required<
      Pick<BeautifulMentionsPluginProps, "punctuation" | "searchDelay">
    > {
  loading: boolean;
  triggerFn: TriggerFn;
  onSelectOption: (
    option: MenuOption,
    textNodeContainingQuery: TextNode | null,
  ) => void;
  onQueryChange: (matchingString: string | null) => void;
  options: MenuOption[];
  triggers: string[];
  onReset: () => void;
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

function isCharacterKey(event: KeyboardEvent) {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.repeat
  );
}

export function useAnchorRef(render: boolean, root?: HTMLElement) {
  const [rootElement, setRootElement] = useState<HTMLElement | null>(
    root || null,
  );
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const minHeight = useRef<number>(0);

  useEffect(() => {
    if (root) {
      setRootElement(root);
      return;
    }
    return editor.registerRootListener((rootElement) => {
      if (rootElement) {
        setRootElement(rootElement.parentElement);
      }
    });
  }, [editor, root]);

  useEffect(() => {
    if (!rootElement) {
      return;
    }
    if (!render && anchor && rootElement.contains(anchor)) {
      rootElement.removeChild(anchor);
      setAnchor(null);
      return;
    }
    const element = anchor || document.createElement("div");
    element.style.position = "absolute";
    element.style.left = "0";
    element.style.right = "0";
    rootElement.appendChild(element);
    if (!anchor) {
      setAnchor(element);
    }
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height > minHeight.current) {
        minHeight.current = entry.contentRect.height;
        element.style.minHeight = `${minHeight.current}px`;
        element.style.height = `1px`;
      }
    });
    resizeObserver.observe(element);
    return () => {
      resizeObserver.disconnect();
      rootElement.removeChild(element);
    };
  }, [rootElement, render, anchor]);

  return anchor;
}

export function ComboboxPlugin(props: ComboboxPluginProps) {
  const {
    onSelectOption,
    triggers,
    punctuation,
    loading,
    triggerFn,
    onQueryChange,
    searchDelay,
    comboboxAnchor,
    onReset,
    comboboxComponent: ComboboxComponent = "div",
    comboboxItemComponent: ComboboxItemComponent = "div",
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const anchor = useAnchorRef(focused, comboboxAnchor);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [match, setMatch] = useState<MenuTextMatch | null>(null);
  const [queryString, setQueryString] = useState<string | null>(null);
  const debouncedQueryString = useDebounce(queryString, searchDelay);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const options = useMemo(() => {
    if (props.options.length === 0) {
      const triggerOptions = triggers.map(
        (trigger) => new MenuOption(trigger, trigger),
      );
      if (
        !debouncedQueryString ||
        triggerOptions.every((o) => !o.key.startsWith(debouncedQueryString))
      ) {
        return triggerOptions;
      }
      return triggerOptions.filter((o) =>
        o.key.startsWith(debouncedQueryString),
      );
    }
    return props.options;
  }, [props.options, triggers, debouncedQueryString]);
  const optionsType = props.options.length === 0 ? "triggers" : "mentions";

  const scrollIntoView = useCallback(
    (index: number) => {
      const option = options[index];
      const el = itemRefs.current[option.key];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    },
    [options],
  );

  const handleArrowKeyDown = useCallback(
    (event: KeyboardEvent, direction: "up" | "down") => {
      if (!focused) {
        return false;
      }
      const index = selectedIndex === null ? -1 : selectedIndex;
      const newIndex =
        direction === "down"
          ? index < options.length - 1
            ? index + 1
            : 0
          : index > 0
          ? index - 1
          : options.length - 1;
      setSelectedIndex(newIndex);
      scrollIntoView(newIndex);
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    },
    [focused, selectedIndex, options.length, scrollIntoView],
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
    setQueryString(null);
  }, [onQueryChange]);

  const handleSelectMention = useCallback(
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
      const option = options[index];
      editor.update(() => {
        insertMention(triggers, punctuation, option.key);
      });
      cleanup();
      setSelectedIndex(0);
    },
    [editor, punctuation, triggers, options, cleanup],
  );

  const handleClickOption = useCallback(
    (index: number) => {
      if (optionsType === "triggers") {
        handleSelectTrigger(index);
      }
      if (optionsType === "mentions") {
        handleSelectMention(index);
      }
    },
    [handleSelectMention, handleSelectTrigger, optionsType],
  );

  const handleKeySelect = useCallback(
    (event: KeyboardEvent) => {
      if (!focused || selectedIndex === null) {
        return false;
      }
      let handled = false;
      if (optionsType === "triggers") {
        handled = true;
        handleSelectTrigger(selectedIndex);
      }
      if (optionsType === "mentions") {
        handled = true;
        handleSelectMention(selectedIndex);
      }
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return handled;
    },
    [
      focused,
      handleSelectMention,
      handleSelectTrigger,
      optionsType,
      selectedIndex,
    ],
  );

  const handleBackspace = useCallback(() => {
    setSelectedIndex(null);
    return false;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isCharacterKey(event)) {
        return false;
      }
      const value = queryString === null ? event.key : queryString + event.key;
      if (
        options.some(
          (o) => o.label.startsWith(value) && value.length <= o.label.length,
        )
      ) {
        setSelectedIndex(0);
      } else if (optionsType === "triggers") {
        setSelectedIndex(null);
      }
      return false;
    },
    [options, optionsType, queryString],
  );

  useEffect(() => {
    if (!focused) {
      setSelectedIndex(null);
    }
  }, [focused]);

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
      editor.registerCommand<KeyboardEvent>(
        KEY_BACKSPACE_COMMAND,
        handleBackspace,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        handleKeyDown,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    editor,
    handleArrowKeyDown,
    handleKeySelect,
    handleBackspace,
    handleKeyDown,
  ]);

  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const text = getQueryTextForSearch(editor);
        if (!text) {
          onReset();
          setMatch(null);
          setQueryString(null);
          return;
        }
        setQueryString(text.trim());
        const match = triggerFn(text, editor);
        setMatch(match);
        onQueryChange(match ? match.matchingString : null);
      });
    };
    const removeUpdateListener = editor.registerUpdateListener(updateListener);
    return () => {
      removeUpdateListener();
    };
  }, [editor, triggerFn, onQueryChange, onReset]);

  if (!focused || !anchor) {
    return null;
  }

  return (
    <>
      {ReactDOM.createPortal(
        <ComboboxComponent
          loading={loading}
          optionType={optionsType}
          role="menu"
          aria-activedescendant={
            selectedIndex !== null
              ? `beautiful-mention-combobox-${options[selectedIndex].label}`
              : ""
          }
          aria-label={
            optionsType === "triggers" ? "Choose a trigger" : "Choose a mention"
          }
        >
          {options.map((option, index) => (
            <ComboboxItemComponent
              key={option.key}
              label={option.key}
              selected={index === selectedIndex}
              role="menuitem"
              id={`beautiful-mention-combobox-${option.key}`}
              aria-selected={selectedIndex === index}
              aria-label={`Choose ${option.label}`}
              ref={(el: HTMLElement | null) =>
                (itemRefs.current[option.key] = el)
              }
              onClick={() => handleClickOption(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onMouseDown={(e) => e.preventDefault()}
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
