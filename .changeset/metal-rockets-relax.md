---
"lexical-beautiful-mentions": patch
---

refactor(): deprecate ZeroWidthPlugin and introduce PlaceholderPlugin
- Easier Maintenance: Without the need to handle ZeroWidthNode, the beautiful-mentions codebase becomes less complex, which can lead to fewer bugs and easier maintenance.
- Simplified Export: zero-width characters no longer need to be removed before exporting the content.