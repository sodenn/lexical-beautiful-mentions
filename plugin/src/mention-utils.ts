import {
  $createRangeSelection,
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  LexicalNode,
  RangeSelection,
  RootNode,
  TextNode,
} from "lexical";
import { BeautifulMentionsPluginProps } from "./BeautifulMentionsPluginProps";
import { $isZeroWidthNode } from "./ZeroWidthNode";

interface SelectionInfoBase {
  offset: number;
  textContent: string;
  selection: RangeSelection;
  prevNode: LexicalNode | null;
  nextNode: LexicalNode | null;
  cursorAtStartOfNode: boolean;
  cursorAtEndOfNode: boolean;
  wordCharBeforeCursor: boolean;
  wordCharAfterCursor: boolean;
  spaceBeforeCursor: boolean;
  spaceAfterCursor: boolean;
}

interface TextNodeSelectionInfo extends SelectionInfoBase {
  isTextNode: true;
  node: TextNode;
}

interface LexicalNodeSelectionInfo extends SelectionInfoBase {
  isTextNode: false;
  node: LexicalNode;
}

type SelectionInfo =
  | TextNodeSelectionInfo
  | LexicalNodeSelectionInfo
  | undefined;

export const DEFAULT_PUNCTUATION =
  "\\.,\\*\\?\\$\\|#{}\\(\\)\\^\\[\\]\\\\/!%'\"~=<>_:;";

// Strings that can trigger the mention menu.
export const TRIGGERS = (triggers: string[]) =>
  "(?:" + triggers.join("|") + ")";

// Chars we expect to see in a mention (non-space, non-punctuation).
export const VALID_CHARS = (triggers: string[], punctuation: string) =>
  "(?!" + triggers.join("|") + ")[^\\s" + punctuation + "]";

export const LENGTH_LIMIT = 75;

export function isWordChar(
  char: string,
  triggers: string[],
  punctuation: string,
) {
  return new RegExp(VALID_CHARS(triggers, punctuation)).test(char);
}

export function $getSelectionInfo(
  triggers: string[],
  punctuation: string,
): SelectionInfo {
  const selection = $getSelection();
  if (!selection || !$isRangeSelection(selection)) {
    return;
  }

  const anchor = selection.anchor;
  const focus = selection.focus;
  const nodes = selection.getNodes();
  if (
    anchor.key !== focus.key ||
    anchor.offset !== focus.offset ||
    nodes.length === 0
  ) {
    return;
  }

  const [_node] = nodes;
  const node = $isZeroWidthNode(_node) ? _node.getPreviousSibling() : _node;
  if (!node) {
    return;
  }

  const isTextNode = $isTextNode(node) && node.isSimpleText();
  const offset = anchor.type === "text" ? anchor.offset : 0;
  const textContent = getTextContent(node);
  const cursorAtStartOfNode = offset === 0;
  const cursorAtEndOfNode = textContent.length === offset;
  const charBeforeCursor = textContent.charAt(offset - 1);
  const charAfterCursor = textContent.charAt(offset);
  const wordCharBeforeCursor = isWordChar(
    charBeforeCursor,
    triggers,
    punctuation,
  );
  const wordCharAfterCursor = isWordChar(
    charAfterCursor,
    triggers,
    punctuation,
  );
  const spaceBeforeCursor = /\s/.test(charBeforeCursor);
  const spaceAfterCursor = /\s/.test(charAfterCursor);
  const prevNode = getPreviousSibling(node);
  const nextNode = getNextSibling(node);

  const props = {
    node,
    offset,
    isTextNode,
    textContent,
    selection,
    prevNode,
    nextNode,
    cursorAtStartOfNode,
    cursorAtEndOfNode,
    wordCharBeforeCursor,
    wordCharAfterCursor,
    spaceBeforeCursor,
    spaceAfterCursor,
  };

  if (isTextNode) {
    return {
      ...props,
      isTextNode: true,
      node: node as TextNode,
    };
  } else {
    return {
      ...props,
      isTextNode: false,
      node: node as LexicalNode,
    };
  }
}

export function getNextSibling(node: LexicalNode) {
  let nextSibling = node.getNextSibling();
  while (nextSibling !== null && $isZeroWidthNode(nextSibling)) {
    nextSibling = nextSibling.getNextSibling();
  }
  return nextSibling;
}

export function getPreviousSibling(node: LexicalNode) {
  let previousSibling = node.getPreviousSibling();
  while (previousSibling !== null && $isZeroWidthNode(previousSibling)) {
    previousSibling = previousSibling.getPreviousSibling();
  }
  return previousSibling;
}

export function getTextContent(node: LexicalNode) {
  if ($isZeroWidthNode(node)) {
    return "";
  }
  return node.getTextContent();
}

export function getCreatableProp(
  creatable: BeautifulMentionsPluginProps["creatable"],
  trigger: string | null,
) {
  if (typeof creatable === "string" || typeof creatable === "boolean") {
    return creatable;
  }
  if (trigger === null) {
    return false;
  }
  if (typeof creatable === "object") {
    return creatable[trigger];
  }
  return false;
}

export function getMenuItemLimitProp(
  menuItemLimit: BeautifulMentionsPluginProps["menuItemLimit"],
  trigger: string | null,
) {
  if (typeof menuItemLimit === "number" || menuItemLimit === false) {
    return menuItemLimit;
  }
  if (typeof menuItemLimit === "undefined") {
    return 5;
  }
  if (trigger === null) {
    return false;
  }
  if (typeof menuItemLimit === "object") {
    return menuItemLimit[trigger];
  }
  return 5;
}

function getLastNode(root: RootNode) {
  const descendant = root.getLastDescendant();
  if ($isElementNode(descendant) || $isTextNode(descendant)) {
    return descendant;
  }
  if ($isDecoratorNode(descendant)) {
    return descendant.getParent();
  }
  return root;
}

export function $selectEnd() {
  const root = $getRoot();
  const lastNode = getLastNode(root);
  const key = lastNode && lastNode.getKey();
  const offset = $isElementNode(lastNode)
    ? lastNode.getChildrenSize()
    : $isTextNode(lastNode)
      ? getTextContent(lastNode).length
      : 0;
  const type = $isElementNode(lastNode) ? "element" : "text";
  if (key) {
    const newSelection = $createRangeSelection();
    newSelection.anchor.set(key, offset, type);
    newSelection.focus.set(key, offset, type);
    $setSelection(newSelection);
  }
}
