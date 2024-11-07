# lexical-beautiful-mentions

## 0.1.44

### Patch Changes

- 68c908e: feat(): insertMention function use autoSpace of config

## 0.1.43

### Patch Changes

- df15d2f: fix(): prevent unintended deletion of text after inserting a mention
- f3153a0: fix(): ensure space is added after multi-character trigger mention

## 0.1.42

### Patch Changes

- bd1b143: feat: make mention auto-spacing configurable
- 7e53fbd: refactor(): deprecate ZeroWidthPlugin and introduce PlaceholderPlugin
  - Easier Maintenance: Without the need to handle ZeroWidthNode, the beautiful-mentions codebase becomes less complex, which can lead to fewer bugs and easier maintenance.
  - Simplified Export: zero-width characters no longer need to be removed before exporting the content.

## 0.1.41

### Patch Changes

- 9e795c1: feat(): show suggestions even if the cursor is in the middle of the query
- fbf63cc: feat(): insert mention when pressing a non-word character

## 0.1.40

### Patch Changes

- e71a286: feat($transformTextToMentionNodes): add utility function to transform text nodes to mention nodes

## 0.1.39

### Patch Changes

- 9ef8442: fix(): prevent error with apple pencil when key is undefined #575 [thanks, @circlingthesun]

## 0.1.38

### Patch Changes

- f481f85: fix($findBeautifulMentionNodes): add null check for CustomBeautifulMentionNode

## 0.1.37

### Patch Changes

- f041caa: fix(): add space between text and mention when cursor is at line start and in front of mention
- 2eddba3: fix(useBeautifulMentions): fix broken functions for custom mention node (removeMentions/renameMentions)

## 0.1.36

### Patch Changes

- eb6b1a3: fix(): mention selection not being cleared when clicking outside the editor and focus the editor again
- 7e4b35e: feat(): allow to define a set of characters that can appear directly before the trigger character

## 0.1.35

### Patch Changes

- 9588d0a: fix(): undo not working after insert mention on focus lost

## 0.1.34

### Patch Changes

- 3fc023a: fix(utils): regex always failed to match if triggers are empty (#440) [thanks, @reekystive]
- 8f83624: docs(): add links to sections in README.md
- 8f83624: refactor(): rename `BeautifulMentionsThemeValues` to `BeautifulMentionsCssClassNames` for more understandable naming
- 8f83624: feat(): throw error with explanation when BeautifulMentionNode is not registered on editor

## 0.1.33

### Patch Changes

- 63de856: fix(BeautifulMentionComponent): don't reset the editor selection when a blur event occurs #410

## 0.1.32

### Patch Changes

- b609f78: fix(): allow to select the text when it ends with a mention

## 0.1.31

### Patch Changes

- bf6d8f0: feat(useBeautifulMentions): allow to insert mentions with data

## 0.1.30

### Patch Changes

- 7e1a1ea: refactor(TypeaheadMenuPlugin): use TypeaheadMenuPlugin from `@lexical/react`. ⚠️ Initially, this project has used a copy of `LexicalTypeaheadMenuPlugin` from `@lexical/react` with a few adjustments regarding the positioning of the menu. This is no longer needed as the positioning issues has been fixed. Now, we can use the original `LexicalTypeaheadMenuPlugin` from `@lexical/react`. If the menu is too far below the caret, this is probably due to the absolute positioning (top: x). You can remove the "top" property, as the menu opens directly under the caret now.
- e4f29c1: feat(EmptyComponent): ability to render a custom component if no results are found

## 0.1.29

### Patch Changes

- b2e5c65: fix(createBeautifulMentionNode): add missing return type for custom mention node
- d03f567: fix($convertToMentionNodes): triggers followed by text in the middle of a word should be recognized as mentions

## 0.1.28

### Patch Changes

- 413fcbf: fix(): set missing return type of BeautifulMentionNode methods

## 0.1.27

### Patch Changes

- cb6a655: fix(): onBlur behavior in MentionComponent

## 0.1.26

### Patch Changes

- ab5971d: fix(): insert a space (if necessary) when pasting text
- 18c2bb5: feat(): mentions adopt the selected state when the text section is selected

## 0.1.25

### Patch Changes

- 3f97fa8: fix(): remove the copy-and-paste handling from the plugin and suggest to use the lexical RichTextPlugin instead

## 0.1.24

### Patch Changes

- 2487452: fix(Menu): prevent other key enter commands from blocking the menu from closing

## 0.1.23

### Patch Changes

- cc96095: fix(BeautifulMentionNode + ZeroWidthNode): fix HTML/JSON node serialization & deserialization

## 0.1.22

### Patch Changes

- 17b8bd5: feat(): copy value of selected mention to clipboard
- 2388ee5: fix(ZeroWidthPlugin): 🚨 to avoid that the trigger character is inserted at the wrong position when using `openMentionMenu` (lexical >0.12.4), you need to set the new `textContent` prop of the ZeroWidthPlugin to a non-empty string. Don`t forget to remove the non-empty string characters before saving the content to your database.
- 17b8bd5: feat(): paste mentions from clipboard into editor

## 0.1.21

### Patch Changes

- f60adca: fix(createBeautifulMentionNode): prevent re-creating the BeautifulMentionNode class on every call

## 0.1.20

### Patch Changes

- 662e895: feat(): add null type to BeautifulMentionsItem data fields

## 0.1.19

### Patch Changes

- 215e1ed: feat(Menu): add callback fired when the user selects a menu item
- 7391fb0: fix(Menu): remove typeahead element from DOM after menu is closed

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
