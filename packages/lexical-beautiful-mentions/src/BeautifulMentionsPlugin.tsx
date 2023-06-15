import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  MenuOption as _MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
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
  KEY_DOWN_COMMAND,
  KEY_SPACE_COMMAND,
  NodeSelection,
  RangeSelection,
  TextNode,
} from "lexical";
import React, { useCallback, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import { LexicalTypeaheadMenuPlugin } from "./LexicalTypeaheadMenuPlugin";
import {
  INSERT_MENTION_COMMAND,
  OPEN_MENTIONS_MENU_COMMAND,
  REMOVE_MENTIONS_COMMAND,
  RENAME_MENTIONS_COMMAND,
} from "./MentionCommands";
import {
  $createBeautifulMentionNode,
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";
import {
  checkForMentions,
  getSelectionInfo,
  insertMention,
  isWordChar,
} from "./mention-utils";
import { useDebounce } from "./useDebounce";
import { useIsFocused } from "./useIsFocused";
import { useMentionLookupService } from "./useMentionLookupService";

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

class MenuOption extends _MenuOption {
  value: string;
  label: string;
  constructor(value: string, label?: string) {
    super(value);
    this.value = value;
    this.label = label ?? value;
  }
}

/**
 * A plugin that adds mentions to the lexical editor.
 */
export function BeautifulMentionsPlugin(props: BeautifulMentionsPluginProps) {
  const {
    items,
    onSearch,
    searchDelay = props.onSearch ? 250 : 0,
    creatable,
    allowSpaces = true,
    insertOnBlur = true,
    menuComponent: MenuComponent = "ul",
    menuItemComponent: MenuItemComponent = "li",
    menuAnchorClassName,
  } = props;
  const isEditorFocused = useIsFocused();
  const triggers = useMemo(
    () => props.triggers || Object.keys(items || {}),
    [props.triggers, items]
  );
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const debouncedQueryString = useDebounce(queryString, searchDelay);
  const [trigger, setTrigger] = useState<string | null>(null);
  const { results, loading } = useMentionLookupService(
    debouncedQueryString,
    trigger,
    items,
    onSearch
  );
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });
  const [oldSelection, setOldSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);

  const options = useMemo(() => {
    // Add options from the lookup service
    const opt = results
      .map((result) => new MenuOption(result))
      .slice(0, SUGGESTION_LIST_LENGTH_LIMIT);
    // Add mentions from the editor
    const readyToAddEditorMentions = !onSearch || debouncedQueryString !== null;
    // when a search function is provided, wait for the delayed search to prevent flickering
    if (readyToAddEditorMentions) {
      editor.getEditorState().read(() => {
        const mentions = $nodesOfType(BeautifulMentionNode);
        for (const mention of mentions) {
          const mentionName = mention.getValue();
          // only add the mention if it's not already in the list
          if (
            mention.getTrigger() === trigger &&
            (debouncedQueryString === null ||
              mention.getValue().startsWith(debouncedQueryString)) &&
            opt.every((o) => o.value !== mentionName)
          ) {
            opt.push(new MenuOption(mentionName, mentionName));
          }
        }
      });
    }
    // Add option to create a new mention
    if (
      debouncedQueryString &&
      opt.every((o) => o.label !== debouncedQueryString)
    ) {
      const creatableName =
        typeof creatable === "string"
          ? creatable.replace("{{name}}", debouncedQueryString)
          : typeof creatable === "undefined" || creatable
          ? `Add "${debouncedQueryString}"`
          : undefined;
      if (creatableName) {
        opt.push(new MenuOption(debouncedQueryString, creatableName));
      }
    }
    return opt;
  }, [results, onSearch, debouncedQueryString, editor, trigger, creatable]);

  const open = isEditorFocused && (!!options.length || loading);

  const handleClose = useCallback(() => {
    setTrigger(null);
  }, []);

  const handleSelectOption = useCallback(
    (
      selectedOption: MenuOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        if (!trigger) {
          return;
        }
        const mentionNode = $createBeautifulMentionNode(
          trigger,
          selectedOption.value
        );
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        closeMenu();
      });
    },
    [editor, trigger]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      // Don't show the menu if the next character is a word character
      const info = getSelectionInfo(triggers);
      if (info?.isTextNode && info.wordCharAfterCursor) {
        return null;
      }

      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }

      const queryMatch = checkForMentions(text, triggers, allowSpaces);
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
    [checkForSlashTriggerMatch, editor, triggers, allowSpaces]
  );

  const insertTextAsMention = useCallback(() => {
    const info = getSelectionInfo(triggers);
    if (!info || !info.isTextNode) {
      return false;
    }
    const node = info.node;
    const textContent = node.getTextContent();
    const queryMatch = checkForMentions(textContent, triggers, false);
    if (queryMatch && queryMatch.replaceableString.length > 1) {
      const trigger = triggers.find((trigger) =>
        queryMatch.replaceableString.startsWith(trigger)
      );
      const end = textContent.search(
        new RegExp(`${queryMatch.replaceableString}\\s?$`)
      );
      if (trigger && end !== -1) {
        const mentionNode = $createBeautifulMentionNode(
          trigger,
          queryMatch.matchingString
        );
        node.setTextContent(textContent.substring(0, end));
        node.insertAfter(mentionNode);
        mentionNode.selectNext();
      }
      return true;
    }
    return false;
  }, [triggers]);

  const restoreSelection = useCallback(() => {
    const selection = $getSelection() || $createRangeSelection();
    if (!selection && oldSelection) {
      $setSelection(oldSelection);
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

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const { key, metaKey, ctrlKey } = event;
          const simpleKey = key.length === 1;
          const isTrigger = triggers.some((trigger) => key === trigger);
          const wordChar = isWordChar(key, triggers);
          const selectionInfo = getSelectionInfo(triggers);
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
            return true;
          }
          if (
            isTextNode &&
            cursorAtEndOfNode &&
            $isBeautifulMentionNode(nextNode)
          ) {
            node.insertAfter($createTextNode(" "));
            return true;
          }
          if (isTextNode && isTrigger && wordCharAfterCursor) {
            const content =
              textContent.substring(0, offset) +
              " " +
              textContent.substring(offset);
            node.setTextContent(content);
            return true;
          }
          if ($isBeautifulMentionNode(node) && nextNode === null) {
            node.insertAfter($createTextNode(" "));
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          if (insertOnBlur && creatable) {
            return insertTextAsMention();
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
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
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_MENTION_COMMAND,
        ({ trigger, value, focus = true }) => {
          restoreSelection();
          const result = insertMention(triggers, trigger, value);
          if (!focus) {
            archiveSelection();
          }
          return result;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        REMOVE_MENTIONS_COMMAND,
        ({ trigger, value, focus }) => {
          let removed = false;
          restoreSelection();
          const mentions = $nodesOfType(BeautifulMentionNode);
          for (const mention of mentions) {
            const sameTrigger = mention.getTrigger() === trigger;
            const sameValue = mention.getValue() === value;
            if (sameTrigger && (sameValue || !value)) {
              const previous = mention.getPreviousSibling();
              const next = mention.getNextSibling();
              mention.remove();
              removed = true;
              // Prevent double spaces
              if (
                previous?.getTextContent().endsWith(" ") &&
                next?.getTextContent().startsWith(" ")
              ) {
                previous.setTextContent(previous.getTextContent().slice(0, -1));
              }
            }
          }
          if (removed && !focus) {
            archiveSelection();
          }
          return removed;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        RENAME_MENTIONS_COMMAND,
        ({ trigger, value, newValue, focus }) => {
          let renamed = false;
          restoreSelection();
          const mentions = $nodesOfType(BeautifulMentionNode);
          for (const mention of mentions) {
            const sameTrigger = mention.getTrigger() === trigger;
            const sameValue = mention.getValue() === value;
            if (sameTrigger && (sameValue || !value)) {
              renamed = true;
              mention.setValue(newValue);
            }
          }
          if (renamed && !focus) {
            archiveSelection();
          }
          return renamed;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_MENTIONS_MENU_COMMAND,
        ({ trigger }) => insertMention(triggers, trigger),
        COMMAND_PRIORITY_LOW
      )
    );
  }, [
    editor,
    triggers,
    allowSpaces,
    insertOnBlur,
    creatable,
    isEditorFocused,
    insertTextAsMention,
    restoreSelection,
    archiveSelection,
  ]);

  return (
    <LexicalTypeaheadMenuPlugin<MenuOption>
      onQueryChange={setQueryString}
      onSelectOption={handleSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      anchorClassName={menuAnchorClassName}
      onClose={handleClose}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
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
              anchorElementRef.current
            )
          : null
      }
    />
  );
}
