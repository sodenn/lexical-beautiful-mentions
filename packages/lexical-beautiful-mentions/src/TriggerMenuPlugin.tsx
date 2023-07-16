import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { MenuOption } from "@lexical/react/LexicalContextMenuPlugin";
import { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  TextNode,
} from "lexical";
import React, { useCallback, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import ComboboxPlugin from "./ComboboxPlugin";
import { TypeaheadMenuPlugin } from "./TypeaheadMenuPlugin";
import { getSelectionInfo } from "./mention-utils";

interface TriggerMenuPluginProps
  extends Pick<
      BeautifulMentionsPluginProps,
      "menuAnchorClassName" | "menuComponent" | "menuItemComponent"
    >,
    Required<Pick<BeautifulMentionsPluginProps, "showTriggers">> {
  triggers: string[];
  mentionsMenuOpen: boolean;
}

export function checkForTriggers(
  text: string,
  triggers: string[],
): MenuTextMatch | null {
  const last = text.split(/\s/).pop() || text;
  const offset = text.lastIndexOf(last);
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

export default function TriggerMenuPlugin(props: TriggerMenuPluginProps) {
  const {
    triggers,
    mentionsMenuOpen,
    menuComponent: MenuComponent = "ul",
    menuItemComponent: MenuItemComponent = "li",
    menuAnchorClassName,
    showTriggers,
  } = props;
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const options = useMemo(
    () =>
      triggers
        .filter((t) => queryString === null || t.startsWith(queryString))
        .map((trigger) => new MenuOption(trigger)),
    [triggers, queryString],
  );
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [typeaheadMenuOpen, setTypeaheadMenuOpen] = useState(false);

  const handleSelectOption = useCallback(
    (
      selectedOption: MenuOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      closeMenu();
      setComboboxOpen(false);
      setTypeaheadMenuOpen(false);
      const textNode = $createTextNode(selectedOption.key);
      if (nodeToReplace) {
        nodeToReplace.insertBefore(textNode);
        textNode.select();
      } else {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([textNode]);
        }
        textNode.selectNext();
      }
    },
    [],
  );

  const checkForTriggerMatch = useCallback(
    (text: string) => {
      const info = getSelectionInfo(triggers);
      if (
        !text ||
        !info ||
        mentionsMenuOpen ||
        comboboxOpen ||
        (info.isTextNode && info.wordCharAfterCursor)
      ) {
        return null;
      }
      const queryMatch = checkForTriggers(text, triggers);
      if (queryMatch) {
        setTypeaheadMenuOpen(true);
        return queryMatch;
      } else {
        setTypeaheadMenuOpen(false);
      }
      return null;
    },
    [comboboxOpen, mentionsMenuOpen, triggers],
  );

  const handleClose = useCallback(() => {
    setComboboxOpen(false);
    setTypeaheadMenuOpen(false);
  }, []);

  const handleOpenTypeahead = useCallback(() => {
    setTypeaheadMenuOpen(true);
  }, []);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const show = showTriggers(event);
          if (show && !mentionsMenuOpen && !typeaheadMenuOpen) {
            const info = getSelectionInfo(triggers);
            if (
              !info ||
              (!info.isTextNode && !!info.prevNode) ||
              (!info.spaceBeforeCursor && info.offset > 0) ||
              (!info.spaceAfterCursor && !info.cursorAtEndOfNode) ||
              (info.nextNode && info.cursorAtEndOfNode)
            ) {
              return false;
            }
            event.preventDefault();
            setComboboxOpen(true);
            setTypeaheadMenuOpen(false);
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, mentionsMenuOpen, showTriggers, triggers, typeaheadMenuOpen]);

  return (
    <>
      <TypeaheadMenuPlugin<MenuOption>
        onSelectOption={handleSelectOption}
        options={options}
        anchorClassName={menuAnchorClassName}
        onClose={handleClose}
        triggerFn={checkForTriggerMatch}
        onOpen={handleOpenTypeahead}
        onQueryChange={setQueryString}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
        ) =>
          anchorElementRef.current
            ? ReactDOM.createPortal(
                <MenuComponent
                  loading={false}
                  open={typeaheadMenuOpen}
                  role="menu"
                  aria-label="Choose a trigger"
                  aria-hidden={!typeaheadMenuOpen}
                >
                  {options.map((option, i) => (
                    <MenuItemComponent
                      key={option.key}
                      tabIndex={-1}
                      selected={selectedIndex === i}
                      ref={option.setRefElement}
                      role="menuitem"
                      aria-selected={selectedIndex === i}
                      aria-label={`Choose ${option.key}`}
                      label={option.key}
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
                      {option.key}
                    </MenuItemComponent>
                  ))}
                </MenuComponent>,
                anchorElementRef.current,
              )
            : null
        }
      />
      <ComboboxPlugin<MenuOption>
        open={comboboxOpen}
        onSelectOption={handleSelectOption}
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
                  loading={false}
                  open={comboboxOpen}
                  role="menu"
                  aria-label="Choose a trigger"
                  aria-hidden={!comboboxOpen}
                >
                  {options.map((option, i) => (
                    <MenuItemComponent
                      key={option.key}
                      tabIndex={-1}
                      selected={selectedIndex === i}
                      ref={option.setRefElement}
                      role="menuitem"
                      aria-selected={selectedIndex === i}
                      aria-label={`Choose ${option.key}`}
                      label={option.key}
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
                      {option.key}
                    </MenuItemComponent>
                  ))}
                </MenuComponent>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
}
