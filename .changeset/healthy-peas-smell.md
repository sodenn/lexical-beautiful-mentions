---
"lexical-beautiful-mentions": patch
---

feat(): more reliable information about the state of the menu / combobox

**BREAKING**:
- Renamed `openMentionsMenu` to `openMentionMenu`
- Removed the `isMentionsMenuOpen` and `isTriggersMenuOpen` functions from the `useBeautifulMentions` hook in favor of the new `onMenuOpen`, `onMenuClose`, `onComboboxOpen`, `onComboboxClose` and `onComboboxItemSelect` props of the `BeautifulMentionsPlugin` component. This leads to a more reliable information about the state of the menu / combobox, since it is no longer determined by DOM elements.
