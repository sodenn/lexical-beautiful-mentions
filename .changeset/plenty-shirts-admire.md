---
"lexical-beautiful-mentions": patch
---

- refactor(): remove `open` prop from Menu component
- refactor(): called `onComboboxFocusChange` with a `BeautifulMentionsComboboxItem` instead of a string

**BREAKING**- `open` prop has been removed from `BeautifulMentionsMenuProps`- `onComboboxFocusChange` now receives a `BeautifulMentionsComboboxItem` instead of a string
