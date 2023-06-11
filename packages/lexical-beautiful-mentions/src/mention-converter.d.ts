import { LexicalNode } from "lexical";
interface MentionEntry {
    type: "mention";
    trigger: string;
    value: string;
}
interface TextEntry {
    type: "text";
    value: string;
}
type Entry = MentionEntry | TextEntry;
export declare function convertToMentionEntries(text: string, triggers: string[]): Entry[];
/**
 * Utility function that takes a string and converts it to a list of mention
 * and text nodes.<br>
 * 🚨 Only works for mentions without spaces. Make sure to disable spaces via
 * the `allowSpaces` prop.
 */
export declare function convertToMentionNodes(text: string, triggers: string[]): LexicalNode[];
export {};
//# sourceMappingURL=mention-converter.d.ts.map