import {
  $applyNodeReplacement,
  DOMConversionMap,
  TextNode,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
} from "lexical";
import { ZERO_WIDTH_CHARACTER } from "./ZeroWidthPlugin";

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
    super(ZERO_WIDTH_CHARACTER, key);
  }

  exportJSON(): SerializedZeroWidthNode {
    return {
      ...super.exportJSON(),
      type: "zeroWidth",
    };
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  isTextEntity(): boolean {
    return true;
  }

  getTextContent(): string {
    // Must be a non-empty string, otherwise nodes inserted via `$insertNodes`
    // are not at the correct position.
    // 🚨 Don't forget to remove the spaces when exporting to JSON.
    // You can use the `removeZeroWidthNodes` function for this.
    return ZERO_WIDTH_CHARACTER;
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
