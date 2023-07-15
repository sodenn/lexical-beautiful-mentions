import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { MenuOption } from "@lexical/react/LexicalContextMenuPlugin";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_MODIFIER_COMMAND,
  TextNode,
} from "lexical";
import React, { useCallback, useMemo, useState } from "react";
import * as ReactDOM from "react-dom";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import ComboboxPlugin from "./ComboboxPlugin";
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
  const options = useMemo(
    () => triggers.map((trigger) => new MenuOption(trigger)),
    [triggers],
  );
  const [open, setOpen] = useState(false);

  const handleSelectOption = useCallback(
    (
      selectedOption: MenuOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      closeMenu();
      setOpen(false);
      const textNode = $createTextNode(selectedOption.key);
      if (nodeToReplace) {
        nodeToReplace.insertAfter(textNode);
      } else {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([textNode]);
        }
      }
      textNode.selectNext();
    },
    [],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (payload) => {
          const show = showTriggers(payload);
          if (show && !mentionsMenuOpen) {
            const info = getSelectionInfo(triggers);
            if (info && (info.isTextNode || !info.prevNode)) {
              payload.preventDefault();
              setOpen(true);
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, mentionsMenuOpen, showTriggers]);

  return (
    <ComboboxPlugin<MenuOption>
      open={open}
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
                open={open}
                role="menu"
                aria-label="Choose a trigger"
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
  );
}
