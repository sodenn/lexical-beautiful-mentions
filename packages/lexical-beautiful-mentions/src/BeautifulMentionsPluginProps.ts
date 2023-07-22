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

export type BeautifulMentionsComboboxProps = ComponentPropsWithRef<any>;

export type BeautifulMentionsComboboxItemProps = BeautifulMentionsMenuItemProps;

interface BeautifulMentionsProps {
  /**
   * If `truthy`, the user can also create new mentions instead of just
   * selecting one from the mention list.
   * If a string is provided, it will be used as the label for the
   * option that creates a new mention. The expression `{{name}}` will be
   * replaced with the value of the user input. If a map is provided,
   * individual labels can be specified for each trigger.
   * @default false
   */
  creatable?: boolean | string | Record<string, boolean | string>;
  /**
   * The class name to apply to the menu component root element.
   */
  menuAnchorClassName?: string;
  /**
   * At most, the specified number of menu items will be rendered.
   * If a map is provided, individual limits can be specified for each
   * trigger.
   * @default 5
   */
  menuItemLimit?: number | false | Record<string, number | false>;
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
   * If `true`, the mention menu will be shown when the user deletes a mention.
   */
  showMentionsOnDelete?: boolean;
  /**
   * Punctuation characters used when looking for mentions.
   * @default {@link DEFAULT_PUNCTUATION}
   */
  punctuation?: string;
}

type BeautifulMentionsMenuComponentsProps = BeautifulMentionsProps & {
  /**
   * The component to use for the menu.
   * @default ul
   */
  menuComponent?: ElementType<BeautifulMentionsMenuProps>;
  /**
   * The component to use for a menu item.
   * @default li
   */
  menuItemComponent?: ElementType<BeautifulMentionsComboboxItemProps>;
  combobox?: never;
  comboboxComponent?: never;
  comboboxItemComponent?: never;
};

type BeautifulMentionsMenuCommandComponentProps = BeautifulMentionsProps & {
  combobox: true;
  /**
   * The component to use for the combobox.
   * @default ul
   */
  comboboxComponent?: ElementType<ComponentPropsWithRef<any>>;
  /**
   * The component to use for a combobox item.
   */
  comboboxItemComponent?: ElementType<BeautifulMentionsComboboxItemProps>;
  menuComponent?: never;
  menuItemComponent?: never;
};

type BeautifulMentionsPluginWithCompProps =
  | BeautifulMentionsMenuComponentsProps
  | BeautifulMentionsMenuCommandComponentProps;

export type BeautifulMentionsSearchProps =
  BeautifulMentionsPluginWithCompProps & {
    items?: never;
    /**
     * The characters that trigger the mention menu.
     */
    triggers: string[];
    /**
     * A function that returns a list of suggestions for a given trigger and
     * query string.
     */
    onSearch: (
      trigger: string,
      queryString?: string | null,
    ) => Promise<string[]>;
    /**
     * The delay in milliseconds before the `onSearch` function is called.
     * @default 250
     */
    searchDelay?: number;
  };

export type BeautifulMentionsItemsProps =
  BeautifulMentionsPluginWithCompProps & {
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
  };

export type BeautifulMentionsPluginProps =
  | BeautifulMentionsSearchProps
  | BeautifulMentionsItemsProps;
