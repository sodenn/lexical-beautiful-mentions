import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useBasicTypeaheadTriggerMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createRangeSelection,
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
import React, { useCallback, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import { ComboboxPlugin } from "./ComboboxPlugin";
import {
  $createBeautifulMentionNode,
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";
import { MenuOption, MenuTextMatch } from "./Menu";
import { TypeaheadMenuPlugin } from "./TypeaheadMenuPlugin";
import { CAN_USE_DOM } from "./environment";
import {
  $insertMentionAtSelection,
  $insertTriggerAtSelection,
  $removeMention,
  $renameMention,
  INSERT_MENTION_COMMAND,
  OPEN_MENTIONS_MENU_COMMAND,
  REMOVE_MENTIONS_COMMAND,
  RENAME_MENTIONS_COMMAND,
} from "./mention-commands";
import {
  $getSelectionInfo,
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
    // The strategy ignores leading whitespace but we need to know it's
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
    combobox,
    menuAnchorClassName,
    showMentionsOnDelete,
    mentionEnclosure,
    punctuation = DEFAULT_PUNCTUATION,
  } = props;
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
  });
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });
  const [oldSelection, setOldSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const creatable = getCreatableProp(props.creatable, trigger);
  const menuItemLimit = getMenuItemLimitProp(props.menuItemLimit, trigger);
  const options = useMemo(() => {
    // Add options from the lookup service
    let opt = results.map((result) => new MenuOption(result));
    if (menuItemLimit !== false && menuItemLimit > 0) {
      opt = opt.slice(0, menuItemLimit);
    }
    // Add mentions from the editor
    const readyToAddEditorMentions = !onSearch || (!loading && query !== null);
    // when a search function is provided, wait for the delayed search to prevent flickering
    if (readyToAddEditorMentions) {
      editor.getEditorState().read(() => {
        const mentions = $nodesOfType(BeautifulMentionNode);
        for (const mention of mentions) {
          const mentionName = mention.getValue();
          // only add the mention if it's not already in the list
          if (
            mention.getTrigger() === trigger &&
            (query === null || mention.getValue().startsWith(query)) &&
            opt.every((o) => o.key !== mentionName)
          ) {
            opt.push(new MenuOption(mentionName, mentionName));
          }
        }
      });
    }
    // Add option to create a new mention
    if (query && opt.every((o) => o.label !== query)) {
      const creatableName =
        typeof creatable === "string"
          ? creatable.replace("{{name}}", query)
          : typeof creatable === "undefined" || creatable
          ? `Add "${query}"`
          : undefined;
      if (creatableName) {
        opt.push(new MenuOption(query, creatableName));
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
          creatable && selectedOption.key !== selectedOption.label;
        const value =
          newMention && mentionEnclosure && /\s/.test(selectedOption.key)
            ? mentionEnclosure + selectedOption.key + mentionEnclosure
            : selectedOption.key;
        const mentionNode = $createBeautifulMentionNode(trigger, value);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        closeMenu?.();
      });
    },
    [editor, trigger, creatable, mentionEnclosure],
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      // Don't show the menu if the next character is a word character
      const info = $getSelectionInfo(triggers, punctuation);
      if (info?.isTextNode && info.wordCharAfterCursor) {
        return null;
      }

      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
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
    [checkForSlashTriggerMatch, editor, triggers, allowSpaces, punctuation],
  );

  const insertTextAsMention = useCallback(() => {
    const info = $getSelectionInfo(triggers, punctuation);
    if (!info || !info.isTextNode) {
      return false;
    }
    const node = info.node;
    const textContent = node.getTextContent();
    const queryMatch = checkForMentions(
      textContent,
      triggers,
      punctuation,
      false,
    );
    if (queryMatch && queryMatch.replaceableString.length > 1) {
      const trigger = triggers.find((trigger) =>
        queryMatch.replaceableString.startsWith(trigger),
      );
      const end = textContent.search(
        new RegExp(`${queryMatch.replaceableString}\\s?$`),
      );
      if (trigger && end !== -1) {
        const mentionNode = $createBeautifulMentionNode(
          trigger,
          queryMatch.matchingString,
        );
        node.setTextContent(textContent.substring(0, end));
        node.insertAfter(mentionNode);
        mentionNode.selectNext();
      }
      return true;
    }
    return false;
  }, [triggers, punctuation]);

  const setSelection = useCallback(() => {
    const selection = $getSelection();
    if (!selection) {
      $setSelection(oldSelection || $createRangeSelection());
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
      const info = $getSelectionInfo(triggers, punctuation);
      if (info) {
        const { node, prevNode, offset } = info;
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
          if (insertOnBlur && creatable) {
            return insertTextAsMention();
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_SPACE_COMMAND,
        () => {
          if (!allowSpaces && creatable) {
            return insertTextAsMention();
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
          setSelection();
          const removed = $removeMention(trigger, value);
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
          setSelection();
          const renamed = $renameMention(trigger, newValue, value);
          if (renamed && !focus) {
            archiveSelection();
          }
          return renamed;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_MENTIONS_MENU_COMMAND,
        ({ trigger }) =>
          $insertTriggerAtSelection(triggers, punctuation, trigger),
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
    insertTextAsMention,
    setSelection,
    archiveSelection,
    handleKeyDown,
    handleDeleteMention,
  ]);

  if (!CAN_USE_DOM) {
    return null;
  }

  if (combobox) {
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
        comboboxAnchor={props.comboboxAnchor}
        comboboxAnchorClassName={props.comboboxAnchorClassName}
        comboboxComponent={props.comboboxComponent}
        comboboxItemComponent={props.comboboxItemComponent}
      />
    );
  }

  return (
    <TypeaheadMenuPlugin<MenuOption>
      onQueryChange={setQueryString}
      onSelectOption={handleSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      anchorClassName={menuAnchorClassName}
      onClose={handleClose}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current
          ? ReactDOM.createPortal(
              <MenuComponent
                loading={loading}
                open={open}
                role="menu"
                aria-label="Choose a mention"
                aria-hidden={!open}
              >
                {options.map((option, i) => (
                  <MenuItemComponent
                    key={option.key}
                    tabIndex={-1}
                    selected={selectedIndex === i}
                    ref={option.setRefElement}
                    role="menuitem"
                    aria-selected={selectedIndex === i}
                    aria-label={`Choose ${option.label}`}
                    label={option.label}
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
                    {option.label}
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
