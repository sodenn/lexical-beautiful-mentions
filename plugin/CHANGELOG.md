# lexical-beautiful-mentions

## 0.1.18

### Patch Changes

- 50d0ae0: feat(BeautifulMentionComponentProps): data prop with generic type
- 7e14758: feat(): drop check for slash

## 0.1.17

### Patch Changes

- 31c36f2: fix(): adjust query value after selecting an option (#177) [thanks, matusca96]
- 9bc9674: docs(): remove animation from Menu component

## 0.1.16

### Patch Changes

- ea87bf0: fix(): close menu when editor focus is lost

## 0.1.15

### Patch Changes

- 164beac: feat(): add support for custom mention nodes
- a8da266: feat(): add option to enable/disable that the current mentions are displayed as suggestions
- c473eab: feat(): add 'data' field to getMentions function
- 1d2f712: fix(): allows inserting, deleting and renaming mentions when the editor was not previously focused

## 0.1.14

### Patch Changes

- 2ff69af: fix(): do not close combobox when editor focus is lost
- 2ff69af: feat(Combobox): allow to add additional combobox items
- 4ce0123: - refactor(): remove `open` prop from Menu component

  - refactor(): called `onComboboxFocusChange` with a `BeautifulMentionsComboboxItem` instead of a string

  **BREAKING**

  - `open` prop has been removed from `BeautifulMentionsMenuProps`
  - `onComboboxFocusChange` now receives a `BeautifulMentionsComboboxItem` instead of a string

- 2ff69af: feat(Combobox): control the combobox open state

## 0.1.13

### Patch Changes

- 5345e5a: feat(): provide the value of the MenuItem/ComboboxItem as prop
- 9874434: fix(): conditionally useEffect on the server and useLayoutEffect in the browser

## 0.1.12

### Patch Changes

- 5760567: feat(): more reliable information about the state of the menu / combobox

  **BREAKING**:

  - Renamed `openMentionsMenu` to `openMentionMenu`
  - Removed the `isMentionsMenuOpen` and `isTriggersMenuOpen` functions from the `useBeautifulMentions` hook in favor of the new `onMenuOpen`, `onMenuClose`, `onComboboxOpen`, `onComboboxClose` and `onComboboxItemSelect` props of the `BeautifulMentionsPlugin` component. This leads to a more reliable information about the state of the menu / combobox, since it is no longer determined by DOM elements.

- ae9dd61: feat(): improve mention selection for mobile usage

## 0.1.11

### Patch Changes

- c5f0035: fix(): allows undo of mentions
- 4f37da5: feat(Combobox): improve active selection handling
- ac5679c: feat(): allow comboboxAnchor prop to be nullable

## 0.1.10

### Patch Changes

- 63c72e5: feat(): add additional metadata to mentions
- f425ce5: fix(Combobox): keep trigger selection when backspace key is pressed
- 54287e9: refactor(): add prefix to convertToMentionNodes function to indicate the Lexical scope. **BREAKING**: rename `convertToMentionNodes` to `$convertToMentionNodes`.
- 839502c: refactor(): combobox positioning

## 0.1.9

### Patch Changes

- 7e1eb6d: feat(): add combobox as alternative to typeahead menu. **BREAKING**: the `showTriggers` prop has been removed as the combobox shows all available triggers by default.
- 0f55446: feat(): allow mentions with spaces to enclose with custom-defined characters
- 0f55446: feat(): allow to define custom punctuation when looking for mentions
- 10f2c1e: fix(): trigger menu should not re-position when typing

## 0.1.8

### Patch Changes

- c6072bf: fix(): trigger menu should not open before or after other nodes

## 0.1.7

### Patch Changes

- 401421d: fix(): focused mentions should not use the CSS classes defined in "container"

## 0.1.6

### Patch Changes

- fe4e9bd: feat(): show available triggers while typing
- 49de188: style(): allow styling of mention container when trigger and value have separate styling

## 0.1.5

### Patch Changes

- 6d5eb6e: feat(): add option to limit suggested mentions
- 6d5eb6e: feat(): provide a function that tells if the triggers menu is currently open

## 0.1.4

### Patch Changes

- d5e52fd: fix(): prevent the selection from being lost after a focused mention has been deleted
- 6c4d983: feat(): show all available triggers via a configurable shortcut
- 29b9749: style(): separate styles for trigger and value
- 8a769aa: feat(): show mentions menu when mention is deleted

## 0.1.3

### Patch Changes

- bb9d4c7: feat(): add label to BeautifulMentionsMenuItemProps

## 0.1.2

### Patch Changes

- faae1b3: fix(): remove trailing spaces when removing a mention
- b4b2a01: fix(): make sure that the focus is removed when clicking next to the mention

## 0.1.1

### Patch Changes

- a9b1aef: fix(): handle missing focus when inserting, renaming or deleting mentions

## 0.1.0

### Minor Changes

- 903be59: feat(): make it configurable if the editor should be focused after inserting, renaming or deleting mentions

## 0.0.5

### Patch Changes

- 2400fc2: fix(): prevent flickering of the menu when a search function is provided
- 840f7de: fix(): show existing mentions from the editor as suggestions

## 0.0.4

### Patch Changes

- e13cd0a: fix(useBeautifulMentions): hook function should return `true` when the mention menu is open

## 0.0.3

### Patch Changes

- 132fb5c: fix(Menu): use menu + menuitem role instead of list + listitem

## 0.0.2

### Patch Changes

- f40bfe0: Initial version
