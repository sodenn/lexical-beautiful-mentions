import { ComponentPropsWithRef, ElementType } from "react";

export interface BeautifulMentionsMenuProps extends ComponentPropsWithRef<any> {
  /**
   * If `true`, the menu is open.
   */
  open: boolean;
  /**
   * If `true`, the `onSearch` function is currently running.
   */
  loading?: boolean;
}

export interface BeautifulMentionsMenuItemProps
  extends ComponentPropsWithRef<any> {
  /**
   * If `true`, the menu item is selected.
   */
  selected: boolean;
  /**
   * The label of the menu item.
   */
  label: string;
}

interface BeautifulMentionsProps {
  /**
   * If `true`, the user can also create new mentions instead of selecting
   * one from the list of suggestions.
   * If a string is provided, it will be used as the option label for the
   * option that creates a new mention. The expression `{{value}}` will be
   * replaced with the value of the user input.
   * @default true
   */
  creatable?: boolean | string;
  /**
   * The component to use for the menu.
   * @default ul
   */
  menuComponent?: ElementType<BeautifulMentionsMenuProps>;
  /**
   * The component to use for a menu item.
   * @default li
   */
  menuItemComponent?: ElementType<BeautifulMentionsMenuItemProps>;
  /**
   * The class name to apply to the menu component root element.
   */
  menuAnchorClassName?: string;
  /**
   * At most, the specified number of menu items will be rendered.
   * @default 6
   */
  menuItemLimit?: number | false;
  /**
   * If `true`, mentions can contain spaces.
   * @default false
   */
  allowSpaces?: boolean;
  /**
   * Only used if `allowSpaces` is `true`. The given characters are
   * used to enclose mentions if they contain spaces.
   */
  mentionEnclosure?: string;
  /**
   * If `true`, the mention will be inserted when the user blurs the editor.
   * @default true
   */
  insertOnBlur?: boolean;
  /**
   * If the return value is `true`, all available mention triggers will be
   * shown in a menu at the current cursor position.
   *
   * @param event Use the keyboard event to specify a shortcut as a trigger
   */
  showTriggers?: (event: KeyboardEvent) => boolean;
  /**
   * If `true`, the mention menu will be shown when the user deletes a mention.
   */
  showMentionsOnDelete?: boolean;
  /**
   * Punctuation characters used when looking for mentions.
   * @default "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;"
   */
  punctuation?: string;
}

export interface BeautifulMentionsSearchProps extends BeautifulMentionsProps {
  items?: never;
  /**
   * The characters that trigger the mention menu.
   */
  triggers: string[];
  /**
   * A function that returns a list of suggestions for a given trigger and
   * query string.
   */
  onSearch: (trigger: string, queryString?: string | null) => Promise<string[]>;
  /**
   * The delay in milliseconds before the `onSearch` function is called.
   * @default 250
   */
  searchDelay?: number;
}

export interface BeautifulMentionsItemsProps extends BeautifulMentionsProps {
  /**
   * A map of trigger characters to a list of suggestions.
   * The keys of the map are the trigger characters that will be used to
   * open the mention menu. The values are the list of suggestions that
   * will be shown in the menu.
   */
  items: Record<string, string[]>;
  triggers?: never;
  onSearch?: never;
  searchDelay?: never;
}

export type BeautifulMentionsPluginProps =
  | BeautifulMentionsSearchProps
  | BeautifulMentionsItemsProps;
