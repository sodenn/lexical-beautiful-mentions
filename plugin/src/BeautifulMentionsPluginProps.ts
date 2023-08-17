import { ComponentPropsWithRef, ElementType } from "react";

export interface BeautifulMentionsComboboxItem {
  /**
   * Value to be inserted into the editor.
   */
  value: string;
  /**
   * Value to be displayed in the menu.
   */
  displayValue: string;
  /**
   * Additional data belonging to the option.
   */
  data?: { [key: string]: string | boolean | number };
}

/**
 * The mention without the trigger character(s). Either a
 * string or an object with at least a `value` property.
 */
export type BeautifulMentionsItem =
  | string
  | {
      /**
       * The mention without the trigger character(s).
       */
      value: string;
      [key: string]: string | boolean | number;
    };

export interface BeautifulMentionsMenuProps extends ComponentPropsWithRef<any> {
  /**
   * If `true`, the `onSearch` function is currently running.
   */
  loading?: boolean;
}

export type BeautifulMentionsMenuItemProps = Omit<
  ComponentPropsWithRef<any>,
  "selected" | "label"
> & {
  /**
   * If `true`, the menu item is selected.
   */
  selected: boolean;
  /**
   * The label of the menu item.
   */
  label: string;
  /**
   * The value of the menu item.
   */
  itemValue: string;
};

export interface BeautifulMentionsComboboxProps
  extends ComponentPropsWithRef<any> {
  /**
   * The options shown in the combobox can be either triggers or mentions.
   */
  optionType: "triggers" | "values";
  /**
   * If `true`, the `onSearch` function is currently running.
   */
  loading?: boolean;
}

export type BeautifulMentionsComboboxItemProps = Omit<
  ComponentPropsWithRef<any>,
  "selected" | "option"
> & {
  /**
   * If `true`, the combobox item is selected.
   */
  selected: boolean;
  /**
   * Contains the value, display value and additional data defined in
   * {@link BeautifulMentionsItem} or {@link BeautifulMentionsComboboxItem}.
   */
  item: BeautifulMentionsComboboxItem;
};

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
  menuItemComponent?: ElementType<BeautifulMentionsMenuItemProps>;
  /**
   * If `true`, the mention will be inserted when the user blurs the editor.
   * @default true
   */
  insertOnBlur?: boolean;
  /**
   * Callback fired when the menu requests to be open.
   */
  onMenuOpen?: () => void;
  /**
   * Callback fired when the menu requests to be closed.
   */
  onMenuClose?: () => void;
  combobox?: never;
  comboboxOpen?: never;
  comboboxAnchor?: never;
  comboboxAnchorClassName?: never;
  comboboxComponent?: never;
  comboboxItemComponent?: never;
  comboboxAdditionalItems?: never;
  onComboboxItemSelect?: never;
  onComboboxOpen?: never;
  onComboboxClose?: never;
  onComboboxFocusChange?: never;
};

type BeautifulMentionsMenuCommandComponentProps = BeautifulMentionsProps & {
  /**
   * If `true`, replaces the typeahead menu with a combobox that opens below
   * the editor. The combobox shows the currently available triggers and
   * mentions.
   */
  combobox: true;
  /**
   * If `true`, the combobox is open.
   */
  comboboxOpen?: boolean;
  /**
   * The element that the combobox will be attached to.
   * @default editor root element
   */
  comboboxAnchor?: HTMLElement | null;
  /**
   * The class name to apply to the combobox anchor element.
   */
  comboboxAnchorClassName?: string;
  /**
   * The component to use for the combobox.
   * @default ul
   */
  comboboxComponent?: ElementType<BeautifulMentionsComboboxProps>;
  /**
   * The component to use for a combobox item.
   */
  comboboxItemComponent?: ElementType<BeautifulMentionsComboboxItemProps>;
  /**
   * Additional items to show in the combobox.
   */
  comboboxAdditionalItems?: BeautifulMentionsComboboxItem[];
  /**
   * Callback fired when the user selects a combobox item.
   */
  onComboboxItemSelect?: (item: BeautifulMentionsComboboxItem) => void;
  /**
   * Callback fired when the combobox requests to be open.
   */
  onComboboxOpen?: () => void;
  /**
   * Callback fired when the combobox requests to be closed.
   */
  onComboboxClose?: () => void;
  /**
   * Callback fired when the focus of the currently selected combobox
   * item changes.
   */
  onComboboxFocusChange?: (item: BeautifulMentionsComboboxItem | null) => void;
  menuComponent?: never;
  menuItemComponent?: never;
  insertOnBlur?: never;
  onMenuOpen?: never;
  onMenuClose?: never;
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
    ) => Promise<BeautifulMentionsItem[]>;
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
    items: Record<string, BeautifulMentionsItem[]>;
    triggers?: never;
    onSearch?: never;
    searchDelay?: never;
  };

export type BeautifulMentionsPluginProps =
  | BeautifulMentionsSearchProps
  | BeautifulMentionsItemsProps;
