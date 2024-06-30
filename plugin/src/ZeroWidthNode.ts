import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
  TextNode,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
} from "lexical";
import { ZERO_WIDTH_CHARACTER } from "./ZeroWidthPlugin";

export type SerializedZeroWidthNode = SerializedTextNode;

function convertZeroWidthElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  return null;
}

/**
 * @deprecated Use `PlaceholderNode` instead. This Node will be removed in a future version.
 */
/* eslint @typescript-eslint/no-unused-vars: "off" */
export class ZeroWidthNode extends TextNode {
  static getType(): string {
    return "zeroWidth";
  }

  static clone(node: ZeroWidthNode): ZeroWidthNode {
    return new ZeroWidthNode(node.__textContent, node.__key);
  }

  static importJSON(_: SerializedZeroWidthNode): ZeroWidthNode {
    return $createZeroWidthNode();
  }

  constructor(
    private __textContent: string,
    key?: NodeKey,
  ) {
    super(ZERO_WIDTH_CHARACTER, key);
  }

  exportJSON(): SerializedZeroWidthNode {
    return {
      ...super.exportJSON(),
      text: "",
      type: "zeroWidth",
    };
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    return { element: null };
  }

  isTextEntity(): boolean {
    return true;
  }

  getTextContent(): string {
    return this.__textContent;
  }
}

export function $createZeroWidthNode(textContent = ""): ZeroWidthNode {
  const zeroWidthNode = new ZeroWidthNode(textContent);

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
