import {
  $applyNodeReplacement,
  DOMConversionMap,
  EditorConfig,
  ElementNode,
  SerializedElementNode,
  type LexicalNode,
  type NodeKey,
} from "lexical";

export type SerializedPlaceholderNode = SerializedElementNode;

/* eslint @typescript-eslint/no-unused-vars: "off" */
export class PlaceholderNode extends ElementNode {
  static getType(): string {
    return "placeholder";
  }

  static clone(node: PlaceholderNode): PlaceholderNode {
    return new PlaceholderNode(node.__textContent, node.__key);
  }

  constructor(
    private __textContent: string,
    key?: NodeKey,
  ) {
    super(key);
  }

  createDOM(_: EditorConfig): HTMLImageElement {
    const element = document.createElement("img");
    element.style.display = "inline";
    element.style.border = "none";
    element.style.margin = "0";
    element.style.height = "1px";
    element.style.width = "1px";
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  static importJSON(_: SerializedPlaceholderNode): PlaceholderNode {
    return $createPlaceholderNode();
  }

  isInline(): boolean {
    return true;
  }

  exportJSON(): SerializedPlaceholderNode {
    return {
      ...super.exportJSON(),
      type: "placeholder",
    };
  }

  getTextContent(): string {
    return "";
  }
}

export function $createPlaceholderNode(textContent = ""): PlaceholderNode {
  const placeholderNode = new PlaceholderNode(textContent);
  return $applyNodeReplacement(placeholderNode);
}

export function $isPlaceholderNode(
  node: LexicalNode | null | undefined,
): node is PlaceholderNode {
  return node instanceof PlaceholderNode;
}
