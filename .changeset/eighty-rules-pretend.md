---
"lexical-beautiful-mentions": patch
---

refactor(TypeaheadMenuPlugin): use TypeaheadMenuPlugin from `@lexical/react`. ⚠️ Initially, this project has used a copy of `LexicalTypeaheadMenuPlugin` from `@lexical/react` with a few adjustments regarding the positioning of the menu. This is no longer needed as the positioning issues has been fixed. Now, we can use the original `LexicalTypeaheadMenuPlugin` from `@lexical/react`. If the menu is too far below the caret, this is probably due to the absolute positioning (top: x). You can remove the "top" property, as the menu opens directly under the caret now.
