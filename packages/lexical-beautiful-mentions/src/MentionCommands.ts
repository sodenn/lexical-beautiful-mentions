import { createCommand, LexicalCommand } from "lexical";

export interface InsertMention {
  trigger: string;
  value: string;
}

export interface RemoveMentions {
  trigger: string;
  value?: string;
}

export interface RenameMentions {
  trigger: string;
  newValue: string;
  value?: string;
}

export interface HasMentions {
  trigger: string;
  value?: string;
}

export interface OpenMentionsMenu {
  trigger: string;
}

export const INSERT_MENTION_COMMAND: LexicalCommand<InsertMention> =
  createCommand("INSERT_MENTION_COMMAND");

export const REMOVE_MENTIONS_COMMAND: LexicalCommand<RemoveMentions> =
  createCommand("REMOVE_MENTIONS_COMMAND");

export const RENAME_MENTIONS_COMMAND: LexicalCommand<RenameMentions> =
  createCommand("RENAME_MENTIONS_COMMAND");

export const HAS_MENTIONS_COMMAND: LexicalCommand<HasMentions> = createCommand(
  "HAS_MENTIONS_COMMAND"
);

export const OPEN_MENTIONS_MENU_COMMAND: LexicalCommand<OpenMentionsMenu> =
  createCommand("OPEN_MENTIONS_MENU_COMMAND");
