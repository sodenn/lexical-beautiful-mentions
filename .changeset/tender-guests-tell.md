---
"lexical-beautiful-mentions": patch
---

fix(ZeroWidthPlugin): 🚨 to avoid that the trigger character is inserted at the wrong position when using `openMentionMenu` (lexical >0.12.4), you need to set the new `textContent` prop of the ZeroWidthPlugin to a non-empty string. Don`t forget to remove the non-empty string characters before saving the content to your database.
