import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  FOCUS_COMMAND,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  BeautifulMentionsComboboxItem,
  BeautifulMentionsPluginProps,
} from "./BeautifulMentionsPluginProps";
import {
  $splitNodeContainingQuery,
  MenuOption,
  MenuTextMatch,
  TriggerFn,
} from "./Menu";
import { IS_MOBILE } from "./environment";
import { $insertTriggerAtSelection } from "./mention-commands";
import { useIsFocused } from "./useIsFocused";

interface ComboboxPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      | "comboboxOpen"
      | "onComboboxItemSelect"
      | "comboboxAdditionalItems"
      | "comboboxAnchor"
      | "comboboxAnchorClassName"
      | "comboboxComponent"
      | "comboboxItemComponent"
      | "onComboboxOpen"
      | "onComboboxClose"
      | "onComboboxFocusChange"
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

class ComboboxOption extends MenuOption {
  additionalItem: boolean;

  constructor(
    value: string,
    displayValue: string,
    data: { [key: string]: string | boolean | number } = {},
    additionalItem = false,
  ) {
    super(value, displayValue, data);
    this.additionalItem = additionalItem;
  }

  toComboboxItem(): BeautifulMentionsComboboxItem {
    return {
      value: this.value,
      displayValue: this.displayValue,
      data: this.data,
    };
  }
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
  comboboxAnchor?: HTMLElement | null,
  comboboxAnchorClassName?: string,
) {
  const [editor] = useLexicalComposerContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(
    comboboxAnchor || null,
  );
  const [anchorChild, setAnchorChild] = useState<HTMLElement | null>(null);

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
    const newAnchorChild = anchorChild || document.createElement("div");
    newAnchorChild.style.position = "absolute";
    newAnchorChild.style.left = "0";
    newAnchorChild.style.right = "0";
    newAnchorChild.style.paddingTop = `${height}px`;
    newAnchorChild.className = comboboxAnchorClassName || "";
    anchor.prepend(newAnchorChild);
    if (!anchorChild) {
      setAnchorChild(newAnchorChild);
    }
    const anchorObserver = new ResizeObserver(([entry]) => {
      newAnchorChild.style.paddingTop = `${entry.contentRect.height}px`;
    });
    anchorObserver.observe(anchor);
    return () => {
      anchorObserver.disconnect();
      anchor.removeChild(newAnchorChild);
    };
  }, [anchor, render, anchorChild, comboboxAnchorClassName]);

  return anchorChild;
}

export function checkForTriggers(
  text: string,
  triggers: string[],
): MenuTextMatch | null {
  const last = text.split(/\s/).pop() || text;
  const offset = text !== last ? text.lastIndexOf(last) : 0;
  const match = triggers.some((t) => t.startsWith(last) && t !== last);
  if (match) {
    return {
      leadOffset: offset,
      matchingString: last,
      replaceableString: last,
    };
  }
  return null;
}

export function ComboboxPlugin(props: ComboboxPluginProps) {
  const {
    onSelectOption,
    triggers,
    punctuation,
    loading,
    triggerFn,
    onQueryChange,
    onReset,
    comboboxAnchor,
    comboboxAnchorClassName,
    comboboxComponent: ComboboxComponent = "div",
    comboboxItemComponent: ComboboxItemComponent = "div",
    onComboboxOpen,
    onComboboxClose,
    onComboboxFocusChange,
    comboboxAdditionalItems = [],
    onComboboxItemSelect,
  } = props;
  const focused = useIsFocused();
  const [editor] = useLexicalComposerContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [triggerMatch, setTriggerMatch] = useState<MenuTextMatch | null>(null);
  const [valueMatch, setValueMatch] = useState<MenuTextMatch | null>(null);
  const [triggerQueryString, setTriggerQueryString] = useState<string | null>(
    null,
  );
  const optionsType = props.options.length === 0 ? "triggers" : "values";
  const options = useMemo(() => {
    const additionalOptions = comboboxAdditionalItems.map(
      (opt) => new ComboboxOption(opt.value, opt.displayValue, opt.data, true),
    );
    if (optionsType === "triggers") {
      const triggerOptions = triggers.map(
        (trigger) => new ComboboxOption(trigger, trigger),
      );
      if (
        !triggerQueryString ||
        triggerOptions.every((o) => !o.value.startsWith(triggerQueryString))
      ) {
        return [...triggerOptions, ...additionalOptions];
      }
      return [
        ...triggerOptions.filter((o) => o.value.startsWith(triggerQueryString)),
        ...additionalOptions,
      ];
    }
    return [
      ...props.options.map(
        (opt) => new ComboboxOption(opt.value, opt.displayValue),
      ),
      ...additionalOptions,
    ];
  }, [
    comboboxAdditionalItems,
    optionsType,
    props.options,
    triggers,
    triggerQueryString,
  ]);
  const [open, setOpen] = useState(props.comboboxOpen || false);
  const anchor = useAnchorRef(open, comboboxAnchor, comboboxAnchorClassName);

  const highlightOption = useCallback((index: number | null) => {
    if (!IS_MOBILE) {
      setSelectedIndex(index);
    }
  }, []);

  const scrollIntoView = useCallback(
    (index: number) => {
      const option = options[index];
      const el = option.ref?.current;
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
      let newIndex: number | null;
      if (direction === "up") {
        if (selectedIndex === null) {
          newIndex = options.length - 1;
        } else if (selectedIndex === 0) {
          newIndex = null;
        } else {
          newIndex = selectedIndex - 1;
        }
      } else {
        if (selectedIndex === null) {
          newIndex = 0;
        } else if (selectedIndex === options.length - 1) {
          newIndex = null;
        } else {
          newIndex = selectedIndex + 1;
        }
      }
      highlightOption(newIndex);
      if (newIndex) {
        scrollIntoView(newIndex);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    },
    [focused, selectedIndex, options.length, scrollIntoView, highlightOption],
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      highlightOption(index);
      scrollIntoView(index);
    },
    [scrollIntoView, highlightOption],
  );

  const handleMouseLeave = useCallback(() => {
    highlightOption(null);
  }, [highlightOption]);

  const handleSelectValue = useCallback(
    (index: number) => {
      const option = options[index];
      onComboboxItemSelect?.(option.toComboboxItem());
      if (option.additionalItem) {
        return;
      }
      editor.update(() => {
        const textNode = valueMatch
          ? $splitNodeContainingQuery(valueMatch)
          : null;
        onSelectOption(option, textNode);
      });
      setValueMatch(null);
      onQueryChange(null);
      setTriggerQueryString(null);
      highlightOption(null);
    },
    [
      options,
      editor,
      onQueryChange,
      highlightOption,
      onComboboxItemSelect,
      valueMatch,
      onSelectOption,
    ],
  );

  const handleSelectTrigger = useCallback(
    (index: number) => {
      const option = options[index];
      onComboboxItemSelect?.(option.toComboboxItem());
      if (option.additionalItem) {
        return;
      }
      editor.update(() => {
        const nodeToReplace = triggerMatch
          ? $splitNodeContainingQuery(triggerMatch)
          : null;
        if (nodeToReplace) {
          const textNode = $createTextNode(option.value);
          nodeToReplace.replace(textNode);
          textNode.select();
        } else {
          $insertTriggerAtSelection(triggers, punctuation, option.value);
        }
      });
      setTriggerMatch(null);
      setTriggerQueryString(null);
      highlightOption(0);
    },
    [
      options,
      editor,
      highlightOption,
      onComboboxItemSelect,
      triggerMatch,
      triggers,
      punctuation,
    ],
  );

  const handleClickOption = useCallback(
    (index: number) => {
      if (optionsType === "triggers") {
        handleSelectTrigger(index);
      }
      if (optionsType === "values") {
        handleSelectValue(index);
      }
    },
    [optionsType, handleSelectTrigger, handleSelectValue],
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
      if (optionsType === "values") {
        handled = true;
        handleSelectValue(selectedIndex);
      }
      if (handled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return handled;
    },
    [
      focused,
      handleSelectValue,
      handleSelectTrigger,
      optionsType,
      selectedIndex,
    ],
  );

  const handleBackspace = useCallback(() => {
    const text = getQueryTextForSearch(editor);
    const newText = text ? text.substring(0, text.length - 1) : undefined;
    if (!newText || !newText.trim()) {
      highlightOption(null);
    }
    return false;
  }, [editor, highlightOption]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      setOpen(true);
      if (!isCharacterKey(event)) {
        return false;
      }
      const text = getQueryTextForSearch(editor);
      const value = text === null ? event.key : text + event.key;
      const valueTrimmed = value.trim();
      if (
        options.some(
          (o) =>
            o.displayValue.startsWith(valueTrimmed) &&
            valueTrimmed.length <= o.displayValue.length,
        )
      ) {
        highlightOption(0);
      } else if (optionsType === "triggers") {
        highlightOption(null);
      }
      return false;
    },
    [editor, options, optionsType, highlightOption],
  );

  const handleFocus = useCallback(() => {
    setOpen(true);
    return false;
  }, []);

  const handleBlur = useCallback(() => {
    setOpen(false);
    if (!triggerQueryString) {
      setSelectedIndex(null);
      setTriggerQueryString(null);
      setTriggerMatch(null);
      setValueMatch(null);
    }
    return false;
  }, [triggerQueryString]);

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
        FOCUS_COMMAND,
        handleFocus,
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand<KeyboardEvent>(
        BLUR_COMMAND,
        handleBlur,
        COMMAND_PRIORITY_NORMAL,
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
    handleFocus,
    handleBlur,
  ]);

  useEffect(() => {
    const updateListener = () => {
      editor.getEditorState().read(() => {
        const text = getQueryTextForSearch(editor);
        // reset if no text
        if (text === null) {
          onReset();
          setTriggerMatch(null);
          setValueMatch(null);
          onQueryChange(null);
          setTriggerQueryString(null);
          return;
        }
        // check for triggers
        const triggerMatch = checkForTriggers(text, triggers);
        setTriggerMatch(triggerMatch);
        if (triggerMatch) {
          setTriggerQueryString(triggerMatch.matchingString);
          setValueMatch(null);
          return;
        }
        // check for mentions
        const valueMatch = triggerFn(text, editor);
        setValueMatch(valueMatch);
        onQueryChange(valueMatch ? valueMatch.matchingString : null);
        if (valueMatch && valueMatch.matchingString) {
          setTriggerQueryString(valueMatch.matchingString);
          return;
        }
        setTriggerQueryString(null);
      });
    };
    return editor.registerUpdateListener(updateListener);
  }, [editor, triggerFn, onQueryChange, onReset, triggers]);

  useEffect(() => {
    setOpen(props.comboboxOpen || false);
  }, [props.comboboxOpen]);

  // call open/close callbacks when open state changes
  useEffect(() => {
    if (open) {
      onComboboxOpen?.();
    } else {
      onComboboxClose?.();
    }
  }, [onComboboxOpen, onComboboxClose, open]);

  // call select callback when focused option changes
  useEffect(() => {
    if (selectedIndex !== null && !!options[selectedIndex]) {
      onComboboxFocusChange?.(options[selectedIndex].value);
    } else {
      onComboboxFocusChange?.(null);
    }
  }, [selectedIndex, options, onComboboxFocusChange]);

  if (!open || !anchor) {
    return null;
  }

  return ReactDOM.createPortal(
    <ComboboxComponent
      loading={loading}
      optionType={optionsType}
      role="menu"
      aria-activedescendant={
        selectedIndex !== null && !!options[selectedIndex]
          ? options[selectedIndex].displayValue
          : ""
      }
      aria-label={"Choose trigger and value"}
      aria-hidden={!open}
    >
      {options.map((option, index) => (
        <ComboboxItemComponent
          key={option.key}
          selected={index === selectedIndex}
          role="menuitem"
          aria-selected={selectedIndex === index}
          aria-label={`Choose ${option.value}`}
          item={option.toComboboxItem()}
          ref={option.setRefElement}
          onClick={() => handleClickOption(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={(e) => e.preventDefault()}
        >
          {option.displayValue}
        </ComboboxItemComponent>
      ))}
    </ComboboxComponent>,
    anchor,
  );
}
