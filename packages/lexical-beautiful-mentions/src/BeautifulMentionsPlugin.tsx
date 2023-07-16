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
import {
  $createBeautifulMentionNode,
  $isBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";
import TriggerMenuPlugin from "./TriggerMenuPlugin";
import { TypeaheadMenuPlugin } from "./TypeaheadMenuPlugin";
import { CAN_USE_DOM } from "./environment";
import { handleKeydown } from "./handle-keydown";
import {
  INSERT_MENTION_COMMAND,
  OPEN_MENTIONS_MENU_COMMAND,
  REMOVE_MENTIONS_COMMAND,
  RENAME_MENTIONS_COMMAND,
  insertMention,
  removeMention,
  renameMention,
} from "./mention-commands";
import { checkForMentions, getSelectionInfo } from "./mention-utils";
import { useDebounce } from "./useDebounce";
import { useIsFocused } from "./useIsFocused";
import { useMentionLookupService } from "./useMentionLookupService";

// At most, 6 suggestions are shown in the popup.
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
    menuItemLimit,
    menuAnchorClassName,
    showTriggers,
    showMentionsOnDelete,
    mentionEnclosure,
  } = props;
  const isEditorFocused = useIsFocused();
  const triggers = useMemo(
    () => props.triggers || Object.keys(items || {}),
    [props.triggers, items],
  );
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const debouncedQueryString = useDebounce(queryString, searchDelay);
  const [trigger, setTrigger] = useState<string | null>(null);
  const { results, loading } = useMentionLookupService(
    debouncedQueryString,
    trigger,
    items,
    onSearch,
  );
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });
  const [oldSelection, setOldSelection] = useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);

  const options = useMemo(() => {
    // Add options from the lookup service
    let opt = results.map((result) => new MenuOption(result));
    if (menuItemLimit !== false) {
      opt = opt.slice(0, menuItemLimit || SUGGESTION_LIST_LENGTH_LIMIT);
    }
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
  }, [
    results,
    onSearch,
    debouncedQueryString,
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
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        if (!trigger) {
          return;
        }
        const newMention =
          creatable && selectedOption.value !== selectedOption.label;
        const value =
          newMention && mentionEnclosure && /\s/.test(selectedOption.value)
            ? mentionEnclosure + selectedOption.value + mentionEnclosure
            : selectedOption.value;
        const mentionNode = $createBeautifulMentionNode(trigger, value);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        closeMenu();
      });
    },
    [editor, trigger, creatable, mentionEnclosure],
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
    [checkForSlashTriggerMatch, editor, triggers, allowSpaces],
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
  }, [triggers]);

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
      const info = getSelectionInfo(triggers);
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
    [triggers, showMentionsOnDelete],
  );

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => handleKeydown(event, triggers),
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
          const inserted = insertMention(triggers, trigger, value);
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
          const removed = removeMention(trigger, value);
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
          const renamed = renameMention(trigger, newValue, value);
          if (renamed && !focus) {
            archiveSelection();
          }
          return renamed;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        OPEN_MENTIONS_MENU_COMMAND,
        ({ trigger }) => insertMention(triggers, trigger),
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    editor,
    triggers,
    allowSpaces,
    insertOnBlur,
    creatable,
    isEditorFocused,
    insertTextAsMention,
    setSelection,
    archiveSelection,
    handleDeleteMention,
  ]);

  if (!CAN_USE_DOM) {
    return null;
  }

  return (
    <>
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
      {showTriggers && (
        <TriggerMenuPlugin
          triggers={triggers}
          mentionsMenuOpen={open}
          menuAnchorClassName={menuAnchorClassName}
          menuComponent={props.menuComponent}
          menuItemComponent={props.menuItemComponent}
          showTriggers={showTriggers}
        />
      )}
    </>
  );
}
