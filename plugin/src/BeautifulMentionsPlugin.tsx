import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuTextMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $isNodeSelection,
  $isParagraphNode,
  $setSelection,
  BLUR_COMMAND,
  BaseSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_SPACE_COMMAND,
  PASTE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as ReactDOM from "react-dom";
import {
  BeautifulMentionsItemData,
  BeautifulMentionsMenuItem,
  BeautifulMentionsPluginProps,
} from "./BeautifulMentionsPluginProps";
import { ComboboxPlugin } from "./ComboboxPlugin";
import {
  $createBeautifulMentionNode,
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";
import { MenuOption } from "./Menu";
import { CAN_USE_DOM, IS_MOBILE } from "./environment";
import {
  $insertMentionAtSelection,
  $insertTriggerAtSelection,
  $removeMention,
  $renameMention,
  INSERT_MENTION_COMMAND,
  OPEN_MENTION_MENU_COMMAND,
  REMOVE_MENTIONS_COMMAND,
  RENAME_MENTIONS_COMMAND,
} from "./mention-commands";
import {
  $findBeautifulMentionNodes,
  $getSelectionInfo,
  $selectEnd,
  DEFAULT_PUNCTUATION,
  LENGTH_LIMIT,
  PRE_TRIGGER_CHARS,
  TRIGGERS,
  VALID_CHARS,
  getCreatableProp,
  getMenuItemLimitProp,
  isWordChar,
} from "./mention-utils";
import { useIsFocused } from "./useIsFocused";
import { useMentionLookupService } from "./useMentionLookupService";

class MentionOption extends MenuOption {
  readonly menuItem: BeautifulMentionsMenuItem;
  constructor(
    public readonly trigger: string,
    value: string,
    displayValue: string,
    data?: { [key: string]: BeautifulMentionsItemData },
  ) {
    super(value, displayValue, data);
    this.menuItem = {
      trigger,
      value,
      displayValue,
      data,
    };
  }
}

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS = (punctuation: string) =>
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  "\\s|" + // E.g. " " in "Josh Duck"
  "[" +
  punctuation +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

// Regex used to trigger the mention menu.
function createMentionsRegex(
  triggers: string[],
  preTriggerChars: string,
  punctuation: string,
  allowSpaces: boolean,
) {
  return new RegExp(
    (preTriggerChars ? `(^|\\s|${preTriggerChars})(` : "(^|\\s)(") +
      TRIGGERS(triggers) +
      "((?:" +
      VALID_CHARS(triggers, punctuation) +
      (allowSpaces ? VALID_JOINS(punctuation) : "") +
      "){0," +
      LENGTH_LIMIT +
      "})" +
      ")$",
  );
}

export function checkForMentions(
  text: string,
  triggers: string[],
  preTriggerChars: string,
  punctuation: string,
  allowSpaces: boolean,
): MenuTextMatch | null {
  const match = createMentionsRegex(
    triggers,
    preTriggerChars,
    punctuation,
    allowSpaces,
  ).exec(text);
  if (match !== null) {
    // The strategy ignores leading whitespace, but we need to know its
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1];
    const matchingStringWithTrigger = match[2];
    const matchingString = match[3];
    if (matchingStringWithTrigger.length >= 1) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString: matchingString,
        replaceableString: matchingStringWithTrigger,
      };
    }
  }
  return null;
}

/**
 * A plugin that adds mentions to the lexical editor.
 */
export function BeautifulMentionsPlugin(props: BeautifulMentionsPluginProps) {
  const {
    items,
    onSearch,
    autoSpace = true,
    searchDelay = props.onSearch ? 250 : 0,
    allowSpaces = true,
    insertOnBlur = true,
    menuComponent: MenuComponent = "ul",
    menuItemComponent: MenuItemComponent = "li",
    emptyComponent: EmptyComponent,
    menuAnchorClassName,
    showMentionsOnDelete,
    showCurrentMentionsAsSuggestions = true,
    mentionEnclosure,
    onMenuOpen,
    onMenuClose,
    onMenuItemSelect,
    punctuation = DEFAULT_PUNCTUATION,
    preTriggerChars = PRE_TRIGGER_CHARS,
  } = props;
  const justSelectedAnOption = useRef(false);
  const isEditorFocused = useIsFocused();
  const triggers = useMemo(
    () => props.triggers || Object.keys(items || {}),
    [props.triggers, items],
  );
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<string | null>(null);
  const { results, loading, query } = useMentionLookupService({
    queryString,
    searchDelay,
    trigger,
    items,
    onSearch,
    justSelectedAnOption,
  });
  const selectedMenuIndexRef = useRef<number | null>();
  const oldSelection = useRef<BaseSelection | null>(null);
  const creatable = getCreatableProp(props.creatable, trigger);
  const menuItemLimit = getMenuItemLimitProp(props.menuItemLimit, trigger);
  const options = useMemo((): MentionOption[] => {
    if (!trigger) {
      return [];
    }
    // add options from the lookup service
    let opt = results.map((result) => {
      if (typeof result === "string") {
        return new MentionOption(trigger, result, result);
      } else {
        const { value, ...data } = result;
        return new MentionOption(trigger, value, value, data);
      }
    });
    // limit the number of menu items
    if (menuItemLimit !== false && menuItemLimit > 0) {
      opt = opt.slice(0, menuItemLimit);
    }
    // Add mentions from the editor. When a search function is provided, wait for the
    // delayed search to prevent flickering
    const readyToAddCurrentMentions = !onSearch || (!loading && query !== null);
    if (readyToAddCurrentMentions && showCurrentMentionsAsSuggestions) {
      editor.getEditorState().read(() => {
        const mentions = $findBeautifulMentionNodes(editor);
        for (const mention of mentions) {
          const value = mention.getValue();
          const data = mention.getData();
          // only add the mention if it's not already in the list
          if (
            mention.getTrigger() === trigger &&
            (query === null || mention.getValue().startsWith(query)) &&
            opt.every((o) => o.value !== value)
          ) {
            opt.push(new MentionOption(trigger, value, value, data));
          }
        }
      });
    }
    // add option to create a new mention
    if (query && opt.every((o) => o.displayValue !== query)) {
      const displayValue =
        typeof creatable === "string"
          ? creatable.replace("{{name}}", query)
          : typeof creatable === "undefined" || creatable
            ? `Add "${query}"`
            : undefined;
      if (displayValue) {
        opt.push(new MentionOption(trigger, query, displayValue));
      }
    }
    return opt;
  }, [
    results,
    onSearch,
    loading,
    query,
    editor,
    trigger,
    creatable,
    menuItemLimit,
    showCurrentMentionsAsSuggestions,
  ]);

  const open = !!options.length || loading;

  const handleClose = useCallback(() => {
    setTrigger(null);
  }, []);

  const handleSelectOption = useCallback(
    (
      selectedOption: MenuOption,
      nodeToReplace: TextNode | null,
      closeMenu?: () => void,
    ) => {
      editor.update(() => {
        if (!trigger) {
          return;
        }
        const newMention =
          !!creatable && selectedOption.value !== selectedOption.displayValue;
        const value =
          newMention && mentionEnclosure && /\s/.test(selectedOption.value)
            ? // if the value has spaces, wrap it in the enclosure
              mentionEnclosure + selectedOption.value + mentionEnclosure
            : selectedOption.value;
        const mentionNode = $createBeautifulMentionNode(
          trigger,
          value,
          selectedOption.data,
        );
        if (nodeToReplace) {
          const nextSibling = nodeToReplace.getNextSibling();
          nodeToReplace.replace(mentionNode);
          if (nextSibling instanceof TextNode) {
            // prevent that the text directly after the cursor remains in the
            // editor if the user moved back with the cursor when selecting a mention
            const nextSiblingTextContent = nextSibling.getTextContent();
            if (
              !/\s/.test(nextSiblingTextContent) &&
              value.includes(nextSiblingTextContent)
            ) {
              nextSibling.remove();
            }
          }
        }
        closeMenu?.();
        justSelectedAnOption.current = true;
      });
    },
    [editor, trigger, creatable, mentionEnclosure],
  );

  const handleSelectMenuItem = useCallback(
    (
      selectedOption: MenuOption,
      nodeToReplace: TextNode | null,
      closeMenu?: () => void,
    ) => {
      if (!trigger) {
        return;
      }
      onMenuItemSelect?.({
        trigger,
        value: selectedOption.value,
        displayValue: selectedOption.displayValue,
        data: selectedOption.data,
      });
      handleSelectOption(selectedOption, nodeToReplace, closeMenu);
    },
    [handleSelectOption, onMenuItemSelect, trigger],
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const queryMatch = checkForMentions(
        text,
        triggers,
        preTriggerChars,
        punctuation,
        allowSpaces,
      );

      if (queryMatch) {
        const { replaceableString, matchingString } = queryMatch;
        const index = replaceableString.lastIndexOf(matchingString);
        const trigger =
          index === -1
            ? replaceableString
            : replaceableString.substring(0, index) +
              replaceableString.substring(index + matchingString.length);
        setTrigger(trigger || null);
        if (queryMatch.replaceableString) {
          return queryMatch;
        }
      } else {
        setTrigger(null);
      }

      return null;
    },
    [preTriggerChars, allowSpaces, punctuation, triggers],
  );

  const convertTextToMention = useCallback(() => {
    const selectedMenuIndex = selectedMenuIndexRef.current;
    let option =
      typeof selectedMenuIndex === "number"
        ? options[selectedMenuIndex]
        : undefined;
    const newMention = options.find((o) => o.value !== o.displayValue);
    if (newMention && (IS_MOBILE || option === null)) {
      option = newMention;
    }
    if (!option) {
      return false;
    }
    const selectionInfo = $getSelectionInfo(triggers, punctuation);
    if (!trigger || !selectionInfo || !selectionInfo.isTextNode) {
      return false;
    }
    const node = selectionInfo.node;
    const textContent = node.getTextContent();
    const queryMatch = checkForMentions(
      textContent,
      triggers,
      preTriggerChars,
      punctuation,
      allowSpaces,
    );
    if (queryMatch === null) {
      return false;
    }
    const textEndIndex = textContent.search(
      new RegExp(`${queryMatch.replaceableString}\\s?$`),
    );
    if (textEndIndex === -1) {
      return false;
    }
    const mentionNode = $createBeautifulMentionNode(
      trigger,
      option.value,
      option.data,
    );
    editor.update(
      () => {
        node.setTextContent(textContent.substring(0, textEndIndex));
        node.insertAfter(mentionNode);
        mentionNode.selectNext();
      },
      { tag: "history-merge" },
    );
    return true;
  }, [
    editor,
    options,
    preTriggerChars,
    punctuation,
    trigger,
    triggers,
    allowSpaces,
  ]);

  const restoreSelection = useCallback(() => {
    const selection = $getSelection();
    if ((!selection || $isNodeSelection(selection)) && oldSelection.current) {
      const newSelection = oldSelection.current.clone();
      $setSelection(newSelection);
    } else if (!selection) {
      $selectEnd();
    }
    if (oldSelection.current) {
      oldSelection.current = null;
    }
  }, []);

  const handleDeleteMention = useCallback(
    (event: KeyboardEvent) => {
      if (!showMentionsOnDelete) {
        return false;
      }
      const selectionInfo = $getSelectionInfo(triggers, punctuation);
      if (selectionInfo) {
        const { node, prevNode, offset } = selectionInfo;
        const mentionNode = $isBeautifulMentionNode(node)
          ? node
          : $isBeautifulMentionNode(prevNode) && offset === 0
            ? prevNode
            : null;
        if (mentionNode) {
          const trigger = mentionNode.getTrigger();
          mentionNode.replace($createTextNode(trigger));
          event.preventDefault();
          return true;
        }
      }
      return false;
    },
    [showMentionsOnDelete, triggers, punctuation],
  );

  const insertSpaceIfNecessary = useCallback(
    (startsWithTriggerChar = false) => {
      if (!autoSpace) {
        return;
      }

      const selectionInfo = $getSelectionInfo(triggers, punctuation);
      if (!selectionInfo) {
        return;
      }

      const {
        node,
        offset,
        type,
        parentNode,
        isTextNode,
        textContent,
        prevNode,
        nextNode,
        wordCharAfterCursor,
        cursorAtStartOfNode,
        cursorAtEndOfNode,
      } = selectionInfo;

      // [Mention][|][ Text]
      if (
        isTextNode &&
        cursorAtStartOfNode &&
        $isBeautifulMentionNode(prevNode)
      ) {
        node.insertBefore($createTextNode(" "));
        return;
      }

      // ^[|][Mention]
      if (
        $isBeautifulMentionNode(node) &&
        prevNode === null &&
        $isParagraphNode(parentNode) &&
        type === "element" &&
        offset === 0
      ) {
        const textNode = $createTextNode(" ");
        node.insertBefore(textNode);
        textNode.selectStart();
        return;
      }

      // [Text ][|][Mention]
      if (
        isTextNode &&
        cursorAtEndOfNode &&
        $isBeautifulMentionNode(nextNode)
      ) {
        node.insertAfter($createTextNode(" "));
        return;
      }

      // [Text ][|][Text]
      if (isTextNode && startsWithTriggerChar && wordCharAfterCursor) {
        const content =
          textContent.substring(0, offset) +
          " " +
          textContent.substring(offset);
        node.setTextContent(content);
        return;
      }

      // [Mention][|]
      if ($isBeautifulMentionNode(node) && nextNode === null) {
        node.insertAfter($createTextNode(" "));
      }
    },
    [punctuation, triggers, autoSpace],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey } = event;
      const simpleKey = key?.length === 1;
      const wordChar = isWordChar(key, triggers, punctuation);
      const isSpace = allowSpaces && /^\s$/.test(key);
      if (!simpleKey || metaKey || ctrlKey) {
        return false;
      }

      // since the key must not be the same as the trigger, we try to build the trigger
      // by combining the key with the last word before the cursor
      let combinedKey = key;
      const selectionInfo = $getSelectionInfo(triggers, punctuation);
      if (selectionInfo && selectionInfo.isTextNode) {
        const { textContent, offset } = selectionInfo;
        const last = textContent.substring(0, offset).split(/\s+/).at(-1) ?? "";
        combinedKey = (last + key).trim();
      }

      const isTrigger = triggers.some((trigger) => combinedKey === trigger);

      if (!wordChar && !isTrigger && !isSpace) {
        return convertTextToMention();
      }
      insertSpaceIfNecessary(isTrigger);
      return false;
    },
    [
      insertSpaceIfNecessary,
      punctuation,
      convertTextToMention,
      triggers,
      allowSpaces,
    ],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text/plain");
      const firstChar = text && text.charAt(0);
      const isTrigger = triggers.some((trigger) => firstChar === trigger);
      const isPunctuation =
        firstChar && new RegExp(`[\\s${punctuation}]`).test(firstChar);
      if (isTrigger || !isPunctuation) {
        // insert space before pasting if the content starts with a trigger character
        insertSpaceIfNecessary();
      }
      return false; // will be handled by the lexical clipboard module
    },
    [insertSpaceIfNecessary, triggers, punctuation],
  );

  useEffect(() => {
    if (!editor.hasNodes([BeautifulMentionNode])) {
      throw new Error(
        "BeautifulMentionsPlugin: BeautifulMentionNode not registered on editor",
      );
    }
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection();
          if (selection && !$isNodeSelection(selection)) {
            oldSelection.current = selection;
          } else if (!selection) {
            oldSelection.current = null;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        handleKeyDown,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        handleDeleteMention,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (insertOnBlur) {
            return convertTextToMention();
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_SPACE_COMMAND,
        () => {
          if (!allowSpaces && creatable) {
            return convertTextToMention();
          } else {
            return false;
          }
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        INSERT_MENTION_COMMAND,
        ({ trigger, value, data, focus = true }) => {
          restoreSelection();
          const inserted = $insertMentionAtSelection(
            triggers,
            punctuation,
            trigger,
            value,
            data,
            autoSpace,
          );
          if (!focus) {
            $setSelection(null);
          }
          return inserted;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        REMOVE_MENTIONS_COMMAND,
        ({ trigger, value, focus }) => {
          const removed = $removeMention(trigger, value, focus);
          if (!focus) {
            // remove oldSelection manually because the SELECTION_CHANGE_COMMAND
            // listener is not called in this case.
            oldSelection.current = null;
          }
          return removed;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        RENAME_MENTIONS_COMMAND,
        ({ trigger, newValue, value, focus }) =>
          $renameMention(trigger, newValue, value, focus),
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_MENTION_MENU_COMMAND,
        ({ trigger }) => {
          restoreSelection();
          return $insertTriggerAtSelection(
            triggers,
            punctuation,
            trigger,
            autoSpace,
          );
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(PASTE_COMMAND, handlePaste, COMMAND_PRIORITY_LOW),
    );
  }, [
    editor,
    triggers,
    punctuation,
    autoSpace,
    allowSpaces,
    insertOnBlur,
    creatable,
    isEditorFocused,
    convertTextToMention,
    handleKeyDown,
    handleDeleteMention,
    handlePaste,
    restoreSelection,
  ]);

  useEffect(() => {
    if (open && isEditorFocused) {
      onMenuOpen?.();
    } else {
      onMenuClose?.();
    }
    if (open && !isEditorFocused) {
      handleClose();
    }
  }, [onMenuOpen, onMenuClose, open, isEditorFocused, handleClose]);

  if (!CAN_USE_DOM) {
    return null;
  }

  if (props.combobox) {
    return (
      <ComboboxPlugin
        options={options}
        loading={loading}
        onQueryChange={setQueryString}
        onSelectOption={handleSelectOption}
        onReset={() => setTrigger(null)}
        triggerFn={checkForMentionMatch}
        triggers={triggers}
        punctuation={punctuation}
        creatable={creatable}
        comboboxOpen={props.comboboxOpen}
        comboboxAnchor={props.comboboxAnchor}
        comboboxAnchorClassName={props.comboboxAnchorClassName}
        comboboxComponent={props.comboboxComponent}
        comboboxItemComponent={props.comboboxItemComponent}
        comboboxAdditionalItems={props.comboboxAdditionalItems}
        onComboboxOpen={props.onComboboxOpen}
        onComboboxClose={props.onComboboxClose}
        onComboboxFocusChange={props.onComboboxFocusChange}
        onComboboxItemSelect={props.onComboboxItemSelect}
      />
    );
  }

  return (
    <LexicalTypeaheadMenuPlugin<MenuOption>
      commandPriority={COMMAND_PRIORITY_NORMAL}
      onQueryChange={setQueryString}
      onSelectOption={handleSelectMenuItem}
      triggerFn={checkForMentionMatch}
      options={options}
      anchorClassName={menuAnchorClassName}
      onClose={handleClose}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        selectedMenuIndexRef.current = selectedIndex;
        if (
          anchorElementRef.current &&
          options.length === 0 &&
          query &&
          !loading &&
          isEditorFocused &&
          EmptyComponent
        ) {
          return ReactDOM.createPortal(
            <EmptyComponent />,
            anchorElementRef.current,
          );
        }
        return anchorElementRef.current && open
          ? ReactDOM.createPortal(
              <MenuComponent
                loading={loading}
                role="menu"
                aria-label="Choose a mention"
                aria-hidden={!open}
                aria-activedescendant={
                  !IS_MOBILE &&
                  selectedIndex !== null &&
                  !!options[selectedIndex]
                    ? options[selectedIndex].displayValue
                    : ""
                }
              >
                {options.map((option, i) => (
                  <MenuItemComponent
                    key={option.key}
                    tabIndex={-1}
                    selected={!IS_MOBILE && selectedIndex === i}
                    ref={option.setRefElement}
                    role="menuitem"
                    aria-selected={!IS_MOBILE && selectedIndex === i}
                    aria-label={`Choose ${option.value}`}
                    item={option.menuItem}
                    itemValue={option.value}
                    label={option.displayValue}
                    {...option.data}
                    onClick={() => {
                      setHighlightedIndex(i);
                      selectOptionAndCleanUp(option);
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(i);
                    }}
                  >
                    {option.displayValue}
                  </MenuItemComponent>
                ))}
              </MenuComponent>,
              anchorElementRef.current,
            )
          : null;
      }}
    />
  );
}
