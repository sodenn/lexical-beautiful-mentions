import { LexicalCommand } from "lexical";
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
export declare const INSERT_MENTION_COMMAND: LexicalCommand<InsertMention>;
export declare const REMOVE_MENTIONS_COMMAND: LexicalCommand<RemoveMentions>;
export declare const RENAME_MENTIONS_COMMAND: LexicalCommand<RenameMentions>;
export declare const HAS_MENTIONS_COMMAND: LexicalCommand<HasMentions>;
export declare const OPEN_MENTIONS_MENU_COMMAND: LexicalCommand<OpenMentionsMenu>;
//# sourceMappingURL=MentionCommands.d.ts.map