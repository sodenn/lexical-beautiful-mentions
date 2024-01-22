import { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getSelection, $isRangeSelection, TextNode } from "lexical";
import { MutableRefObject } from "react";
import { BeautifulMentionsItemData } from "./BeautifulMentionsPluginProps";
import { getTextContent } from "./mention-utils";

export class MenuOption {
  /**
   * Unique key to iterate over options. Equals to `data` if provided, otherwise
   * `value` is used.
   */
  readonly key: string;
  /**
   * Ref to the DOM element of the option.
   */
  ref?: MutableRefObject<HTMLElement | null>;

  constructor(
    /**
     * The menu item value. For example: "John".
     */
    public readonly value: string,
    /**
     * The value to be displayed. Normally the same as `value` but can be
     * used to display a different value. For example: "Add 'John'".
     */
    public readonly displayValue: string,
    /**
     * Additional data belonging to the option. For example: `{ id: 1 }`.
     */
    public readonly data?: { [key: string]: BeautifulMentionsItemData },
  ) {
    this.key = !data ? value : JSON.stringify({ ...data, value });
    this.displayValue = displayValue ?? value;
    this.ref = { current: null };
    this.setRefElement = this.setRefElement.bind(this);
  }

  setRefElement(element: HTMLElement | null) {
    this.ref = { current: element };
  }
}

/**
 * Split Lexical TextNode and return a new TextNode only containing matched text.
 * Common use cases include: removing the node, replacing with a new node.
 */
export function $splitNodeContainingQuery(
  match: MenuTextMatch,
): TextNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null;
  }
  const anchor = selection.anchor;
  if (anchor.type !== "text") {
    return null;
  }
  const anchorNode = anchor.getNode();
  if (!anchorNode.isSimpleText()) {
    return null;
  }
  const selectionOffset = anchor.offset;
  const textContent = getTextContent(anchorNode).slice(0, selectionOffset);
  const characterOffset = match.replaceableString.length;
  const queryOffset = getFullMatchOffset(
    textContent,
    match.matchingString,
    characterOffset,
  );
  const startOffset = selectionOffset - queryOffset;
  if (startOffset < 0) {
    return null;
  }
  let newNode;
  if (startOffset === 0) {
    [newNode] = anchorNode.splitText(selectionOffset);
  } else {
    [, newNode] = anchorNode.splitText(startOffset, selectionOffset);
  }
  return newNode;
}

/**
 * Walk backwards along user input and forward through entity title to try
 * and replace more of the user's text with entity.
 */
function getFullMatchOffset(
  documentText: string,
  entryText: string,
  offset: number,
): number {
  let triggerOffset = offset;
  for (let i = triggerOffset; i <= entryText.length; i++) {
    if (documentText.substring(-i) === entryText.substring(0, i)) {
      triggerOffset = i;
    }
  }
  return triggerOffset;
}
