import type { SerializedLexicalNode, Spread } from "lexical";
import { DecoratorNode, LexicalEditor, type DOMConversionOutput, type EditorConfig, type LexicalNode, type NodeKey } from "lexical";
import React from "react";
export type SerializedBeautifulMentionNode = Spread<{
    value: string;
    trigger: string;
}, SerializedLexicalNode>;
declare function convertElement(domNode: HTMLElement): DOMConversionOutput | null;
/**
 * This node is used to represent a mention used in the BeautifulMentionPlugin.
 */
export declare class BeautifulMentionNode extends DecoratorNode<React.JSX.Element> {
    __value: string;
    __trigger: string;
    static getType(): string;
    static clone(node: BeautifulMentionNode): BeautifulMentionNode;
    static importJSON(serializedNode: SerializedBeautifulMentionNode): BeautifulMentionNode;
    exportDOM(): {
        element: HTMLSpanElement;
    };
    static importDOM(): {
        span: (domNode: HTMLElement) => {
            conversion: typeof convertElement;
            priority: number;
        } | null;
    };
    constructor(trigger: string, value: string, key?: NodeKey);
    exportJSON(): SerializedBeautifulMentionNode;
    createDOM(): HTMLSpanElement;
    getTextContent(): string;
    updateDOM(): boolean;
    getTrigger(): string;
    getValue(): string;
    setValue(value: string): void;
    decorate(_editor: LexicalEditor, config: EditorConfig): import("react/jsx-runtime").JSX.Element;
}
export declare function $createBeautifulMentionNode(trigger: string, value: string): BeautifulMentionNode;
export declare function $isBeautifulMentionNode(node: LexicalNode | null | undefined): node is BeautifulMentionNode;
export {};
//# sourceMappingURL=MentionNode.d.ts.map