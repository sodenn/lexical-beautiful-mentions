import { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { LexicalNode } from "lexical";
export declare const TRIGGERS: (triggers: string[]) => string;
export declare const VALID_CHARS: (triggers: string[]) => string;
export declare const LENGTH_LIMIT = 75;
export declare function checkForMentions(text: string, triggers: string[], allowSpaces: boolean): MenuTextMatch | null;
export declare function isWordChar(char: string, triggers: string[]): boolean;
export declare function getSelectionInfo(triggers: string[]): {
    node: LexicalNode;
    offset: number;
    isTextNode: boolean;
    textContent: string;
    selection: import("lexical").RangeSelection;
    prevNode: LexicalNode | null;
    nextNode: LexicalNode | null;
    cursorAtStartOfNode: boolean;
    cursorAtEndOfNode: boolean;
    wordCharBeforeCursor: boolean;
    wordCharAfterCursor: boolean;
} | undefined;
export declare function insertMention(triggers: string[], trigger: string, value?: string): boolean;
//# sourceMappingURL=mention-utils.d.ts.map