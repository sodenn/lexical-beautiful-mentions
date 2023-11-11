import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $nodesOfType,
  $setSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_SPACE_COMMAND,
  NodeSelection,
  RangeSelection,
  TextNode,
} from "lexical";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { MenuOption, MenuTextMatch } from "./Menu";
import { TypeaheadMenuPlugin } from "./TypeaheadMenuPlugin";
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
  $getSelectionInfo,
  $selectEnd,
  DEFAULT_PUNCTUATION,
  LENGTH_LIMIT,
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
    /**
     * The trigger that was used to open the menu.
     */
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
  punctuation: string,
  allowSpaces: boolean,
) {
  return new RegExp(
    "(^|\\s|\\()(" +
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
  punctuation: string,
  allowSpaces: boolean,
): MenuTextMatch | null {
  const match = createMentionsRegex(triggers, punctuation, allowSpaces).exec(
    text,
  );
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
    searchDelay = props.onSearch ? 250 : 0,
    allowSpaces = true,
    insertOnBlur = true,
    menuComponent: MenuComponent = "ul",
    menuItemComponent: MenuItemComponent = "li",
    menuAnchorClassName,
    showMentionsOnDelete,
    showCurrentMentionsAsSuggestions = true,
    mentionEnclosure,
    onMenuOpen,
    onMenuClose,
    onMenuItemSelect,
    punctuation = DEFAULT_PUNCTUATION,
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
  const [selectedMenuIndex, setSelectedMenuIndex] = useState<number | null>(
    null,
  );
  const [oldSelection, setOldSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const creatable = getCreatableProp(props.creatable, trigger);
  const menuItemLimit = getMenuItemLimitProp(props.menuItemLimit, trigger);
  const options = useMemo(() => {
    if (!trigger) {
      return [];
    }
    // Add options from the lookup service
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
    // delayed search to prevent flickering.
    const readyToAddCurrentMentions = !onSearch || (!loading && query !== null);
    if (readyToAddCurrentMentions && showCurrentMentionsAsSuggestions) {
      editor.getEditorState().read(() => {
        const mentions = $nodesOfType(BeautifulMentionNode);
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
    // Add option to create a new mention
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

  const open = isEditorFocused && (!!options.length || loading);

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
          nodeToReplace.replace(mentionNode);
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
      // Don't show the menu if the next character is a word character
      const selectionInfo = $getSelectionInfo(triggers, punctuation);
      if (selectionInfo?.isTextNode && selectionInfo.wordCharAfterCursor) {
        return null;
      }

      const queryMatch = checkForMentions(
        text,
        triggers,
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
    [allowSpaces, punctuation, triggers],
  );

  const convertTextToMention = useCallback(() => {
    let option =
      selectedMenuIndex !== null ? options[selectedMenuIndex] : undefined;
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
      punctuation,
      false,
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
    node.setTextContent(textContent.substring(0, textEndIndex));
    node.insertAfter(mentionNode);
    mentionNode.selectNext();
    return true;
  }, [options, punctuation, selectedMenuIndex, trigger, triggers]);

  const setSelection = useCallback(() => {
    const selection = $getSelection();
    if (!selection && oldSelection) {
      $setSelection(oldSelection);
    } else if (!selection) {
      $selectEnd();
    }
    if (oldSelection) {
      setOldSelection(null);
    }
  }, [oldSelection]);

  const archiveSelection = useCallback(() => {
    const selection = $getSelection();
    if (selection) {
      setOldSelection(selection);
      $setSelection(null);
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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey } = event;
      const simpleKey = key.length === 1;
      const isTrigger = triggers.some((trigger) => key === trigger);
      const wordChar = isWordChar(key, triggers, punctuation);
      const selectionInfo = $getSelectionInfo(triggers, punctuation);
      if (
        !simpleKey ||
        (!wordChar && !isTrigger) ||
        !selectionInfo ||
        metaKey ||
        ctrlKey
      ) {
        return false;
      }
      const {
        node,
        offset,
        isTextNode,
        textContent,
        prevNode,
        nextNode,
        wordCharAfterCursor,
        cursorAtStartOfNode,
        cursorAtEndOfNode,
      } = selectionInfo;
      if (
        isTextNode &&
        cursorAtStartOfNode &&
        $isBeautifulMentionNode(prevNode)
      ) {
        node.insertBefore($createTextNode(" "));
      }
      if (
        isTextNode &&
        cursorAtEndOfNode &&
        $isBeautifulMentionNode(nextNode)
      ) {
        node.insertAfter($createTextNode(" "));
      }
      if (isTextNode && isTrigger && wordCharAfterCursor) {
        const content =
          textContent.substring(0, offset) +
          " " +
          textContent.substring(offset);
        node.setTextContent(content);
      }
      if ($isBeautifulMentionNode(node) && nextNode === null) {
        node.insertAfter($createTextNode(" "));
      }
      return false;
    },
    [punctuation, triggers],
  );

  React.useEffect(() => {
    return mergeRegister(
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
        ({ trigger, value, focus = true }) => {
          setSelection();
          const inserted = $insertMentionAtSelection(
            triggers,
            punctuation,
            trigger,
            value,
          );
          if (!focus) {
            archiveSelection();
          }
          return inserted;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        REMOVE_MENTIONS_COMMAND,
        ({ trigger, value, focus }) => {
          const removed = $removeMention(trigger, value, focus);
          if (removed && !focus) {
            archiveSelection();
          }
          return removed;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        RENAME_MENTIONS_COMMAND,
        ({ trigger, newValue, value, focus }) => {
          const renamed = $renameMention(trigger, newValue, value, focus);
          if (renamed && !focus) {
            archiveSelection();
          }
          return renamed;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_MENTION_MENU_COMMAND,
        ({ trigger }) => {
          setSelection();
          return $insertTriggerAtSelection(triggers, punctuation, trigger);
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    editor,
    triggers,
    punctuation,
    allowSpaces,
    insertOnBlur,
    creatable,
    isEditorFocused,
    convertTextToMention,
    setSelection,
    archiveSelection,
    handleKeyDown,
    handleDeleteMention,
  ]);

  useEffect(() => {
    if (open) {
      onMenuOpen?.();
    } else {
      onMenuClose?.();
    }
  }, [onMenuOpen, onMenuClose, open]);

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
    <TypeaheadMenuPlugin<MenuOption>
      onQueryChange={setQueryString}
      onSelectOption={handleSelectMenuItem}
      onSelectionChange={setSelectedMenuIndex}
      triggerFn={checkForMentionMatch}
      options={options}
      anchorClassName={menuAnchorClassName}
      onClose={handleClose}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && (options.length > 0 || loading)
          ? ReactDOM.createPortal(
              <MenuComponent
                loading={loading}
                role="menu"
                aria-label="Choose a mention"
                aria-hidden={!open}
                aria-activedescendant={
                  selectedIndex !== null && !!options[selectedIndex]
                    ? options[selectedIndex].displayValue
                    : ""
                }
              >
                {options.map((option, i) => (
                  <MenuItemComponent
                    key={option.key}
                    tabIndex={-1}
                    selected={selectedIndex === i}
                    ref={option.setRefElement}
                    role="menuitem"
                    aria-selected={selectedIndex === i}
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
          : null
      }
    />
  );
}
