---
"lexical-beautiful-mentions": patch
---

fix(ZeroWidthPlugin): 🚨 to avoid that the trigger character is inserted at the wrong position when using `openMentionMenu` (lexical >0.12.4), the text content is now a zero-width space instead of an empty string. Don`t forget to remove the zero-width spaces before saving the content to your database.
