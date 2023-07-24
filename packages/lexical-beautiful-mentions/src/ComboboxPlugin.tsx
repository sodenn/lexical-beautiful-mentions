import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
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
import { useIsFocused } from "./useIsFocused";

interface ComboboxPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      | "comboboxAnchor"
      | "comboboxAnchorClassName"
      | "comboboxComponent"
      | "comboboxItemComponent"
    >,
    Required<Pick<BeautifulMentionsPluginProps, "punctuation">> {
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

export function useAnchorRef(
  render: boolean,
  comboboxAnchor?: HTMLElement,
  comboboxAnchorClassName?: string,
) {
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(
    comboboxAnchor || null,
  );
  const [anchorChild, setAnchorChild] = useState<HTMLElement | null>(null);
  const anchorHeight = useRef<number>(0);
  const anchorChildMinHeight = useRef<number>(0);

  useEffect(() => {
    if (comboboxAnchor) {
      setAnchor(comboboxAnchor);
      return;
    }
    return editor.registerRootListener((rootElement) => {
      if (rootElement) {
        setAnchor(rootElement.parentElement);
      }
    });
  }, [editor, comboboxAnchor]);

  useEffect(() => {
    if (!anchor) {
      return;
    }
    if (!render) {
      if (anchorChild) {
        anchorChild.remove();
        setAnchorChild(null);
      }
      return;
    }
    const { height } = anchor.getBoundingClientRect();
    anchorHeight.current = height;
    const newAnchorChild = anchorChild || document.createElement("div");
    newAnchorChild.style.position = "absolute";
    newAnchorChild.style.left = "0";
    newAnchorChild.style.right = "0";
    newAnchorChild.style.paddingTop = `${anchorHeight.current}px`;
    newAnchorChild.className = comboboxAnchorClassName || "";
    anchor.prepend(newAnchorChild);
    if (!anchorChild) {
      setAnchorChild(newAnchorChild);
    }
    const anchorObserver = new ResizeObserver(([entry]) => {
      const diff = entry.contentRect.height - anchorHeight.current;
      anchorHeight.current = entry.contentRect.height;
      newAnchorChild.style.paddingTop = `${anchorHeight.current}px`;
      const newMinHeight = parseInt(newAnchorChild.style.minHeight) + diff;
      if (!isNaN(newMinHeight)) {
        newAnchorChild.style.minHeight = `${newMinHeight}px`;
      }
    });
    const anchorChildObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height > anchorChildMinHeight.current) {
        anchorChildMinHeight.current = entry.contentRect.height;
        const newMinHeight =
          anchorChildMinHeight.current + anchorHeight.current;
        newAnchorChild.style.minHeight = `${newMinHeight}px`;
        newAnchorChild.style.height = `1px`;
      }
    });
    anchorObserver.observe(anchor);
    anchorChildObserver.observe(newAnchorChild);
    return () => {
      anchorObserver.disconnect();
      anchorChildObserver.disconnect();
      anchor.removeChild(newAnchorChild);
    };
  }, [anchor, render, anchorChild, comboboxAnchorClassName]);

  return anchorChild;
}

export function ComboboxPlugin(props: ComboboxPluginProps) {
  const {
    onSelectOption,
    triggers,
    punctuation,
    loading,
    triggerFn,
    onQueryChange,
    comboboxAnchor,
    comboboxAnchorClassName,
    onReset,
    comboboxComponent: ComboboxComponent = "div",
    comboboxItemComponent: ComboboxItemComponent = "div",
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [match, setMatch] = useState<MenuTextMatch | null>(null);
  const [queryString, setQueryString] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const optionsType = props.options.length === 0 ? "triggers" : "mentions";
  const options = useMemo(() => {
    if (optionsType === "triggers") {
      const triggerOptions = triggers.map(
        (trigger) => new MenuOption(trigger, trigger),
      );
      if (
        !queryString ||
        triggerOptions.every((o) => !o.key.startsWith(queryString))
      ) {
        return triggerOptions;
      }
      return triggerOptions.filter((o) => o.key.startsWith(queryString));
    }
    return props.options;
  }, [optionsType, props.options, triggers, queryString]);
  const [open, setOpen] = useState(false);
  const anchor = useAnchorRef(open, comboboxAnchor, comboboxAnchorClassName);

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

  const handleSelectMention = useCallback(
    (index: number) => {
      const option = options[index];
      editor.update(() => {
        const textNode = match ? $splitNodeContainingQuery(match) : null;
        onSelectOption(option, textNode);
      });
      setMatch(null);
      onQueryChange(null);
      setQueryString(null);
      setSelectedIndex(null);
    },
    [editor, match, onQueryChange, onSelectOption, options],
  );

  const handleSelectTrigger = useCallback(
    (index: number) => {
      const option = options[index];
      editor.update(() => {
        insertMention(triggers, punctuation, option.key);
      });
      setMatch(null);
      setQueryString(null);
      setSelectedIndex(0);
    },
    [editor, punctuation, triggers, options],
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
      setOpen(true);
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
    if (focused) {
      setOpen(true);
    } else {
      setOpen(false);
      setSelectedIndex(null);
      setQueryString(null);
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
      editor.registerCommand<KeyboardEvent>(
        CLICK_COMMAND,
        () => {
          if (!open) {
            setOpen(true);
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ESCAPE_COMMAND,
        () => {
          setOpen(false);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    editor,
    open,
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
          onQueryChange(null);
        } else {
          const match = triggerFn(text, editor);
          setMatch(match);
          onQueryChange(match ? match.matchingString : null);
          if (!match || !match.matchingString) {
            setQueryString(text.trim());
          } else {
            setQueryString(match.matchingString);
          }
        }
      });
    };
    const removeUpdateListener = editor.registerUpdateListener(updateListener);
    return () => {
      removeUpdateListener();
    };
  }, [editor, triggerFn, onQueryChange, onReset]);

  if (!open || !anchor) {
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
