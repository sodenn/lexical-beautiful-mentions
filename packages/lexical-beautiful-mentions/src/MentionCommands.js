import { createCommand } from "lexical";
export const INSERT_MENTION_COMMAND = createCommand("INSERT_MENTION_COMMAND");
export const REMOVE_MENTIONS_COMMAND = createCommand("REMOVE_MENTIONS_COMMAND");
export const RENAME_MENTIONS_COMMAND = createCommand("RENAME_MENTIONS_COMMAND");
export const HAS_MENTIONS_COMMAND = createCommand("HAS_MENTIONS_COMMAND");
export const OPEN_MENTIONS_MENU_COMMAND = createCommand("OPEN_MENTIONS_MENU_COMMAND");
