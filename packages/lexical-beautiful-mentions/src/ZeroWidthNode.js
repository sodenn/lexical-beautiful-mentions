import { $applyNodeReplacement, TextNode, } from "lexical";
/* eslint @typescript-eslint/no-unused-vars: "off" */
export class ZeroWidthNode extends TextNode {
    static getType() {
        return "zeroWidth";
    }
    static clone(node) {
        return new ZeroWidthNode(node.__key);
    }
    static importJSON(_) {
        return $createZeroWidthNode();
    }
    constructor(key) {
        // Workaround: Use a zero-width space instead of an empty string because
        // otherwise the cursor is not correctly aligned with the line height.
        super("​", key); // 🚨 contains a zero-width space (U+200B)
    }
    exportJSON() {
        return Object.assign(Object.assign({}, super.exportJSON()), { type: "zeroWidth" });
    }
    updateDOM(prevNode, dom, config) {
        return false;
    }
    static importDOM() {
        return null;
    }
    isTextEntity() {
        return true;
    }
    getTextContent() {
        return "";
    }
}
export function $createZeroWidthNode() {
    const zeroWidthNode = new ZeroWidthNode();
    // Prevents that a space that is inserted by the user is deleted again
    // directly after the input.
    zeroWidthNode.setMode("segmented");
    return $applyNodeReplacement(zeroWidthNode);
}
export function $isZeroWidthNode(node) {
    return node instanceof ZeroWidthNode;
}
