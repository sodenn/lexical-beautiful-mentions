import {
  $applyNodeReplacement,
  DOMConversionMap,
  TextNode,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
} from "lexical";
import { EditorConfig } from "lexical/LexicalEditor";

export type SerializedZeroWidthNode = SerializedTextNode;

/* eslint @typescript-eslint/no-unused-vars: "off" */
export class ZeroWidthNode extends TextNode {
  static getType(): string {
    return "zeroWidth";
  }

  static clone(node: ZeroWidthNode): ZeroWidthNode {
    return new ZeroWidthNode(node.__key);
  }

  static importJSON(_: SerializedZeroWidthNode): ZeroWidthNode {
    return $createZeroWidthNode();
  }

  constructor(key?: NodeKey) {
    // Workaround: Use a zero-width space instead of an empty string because
    // otherwise the cursor is not correctly aligned with the line height.
    super("​", key); // 🚨 contains a zero-width space (U+200B)
  }

  exportJSON(): SerializedZeroWidthNode {
    return {
      ...super.exportJSON(),
      type: "zeroWidth",
    };
  }

  updateDOM(
    prevNode: ZeroWidthNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  isTextEntity(): boolean {
    return true;
  }

  getTextContent(): string {
    return "";
  }
}

export function $createZeroWidthNode(): ZeroWidthNode {
  const zeroWidthNode = new ZeroWidthNode();

  // Prevents that a space that is inserted by the user is deleted again
  // directly after the input.
  zeroWidthNode.setMode("segmented");

  return $applyNodeReplacement(zeroWidthNode);
}

export function $isZeroWidthNode(
  node: LexicalNode | null | undefined,
): node is ZeroWidthNode {
  return node instanceof ZeroWidthNode;
}
