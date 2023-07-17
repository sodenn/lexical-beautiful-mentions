import { $createTextNode } from "lexical";
import { $isBeautifulMentionNode } from "./MentionNode";
import { getSelectionInfo, isWordChar } from "./mention-utils";

export function handleKeydown(
  event: KeyboardEvent,
  triggers: string[],
  punctuation: string,
) {
  const { key, metaKey, ctrlKey } = event;
  const simpleKey = key.length === 1;
  const isTrigger = triggers.some((trigger) => key === trigger);
  const wordChar = isWordChar(key, triggers, punctuation);
  const selectionInfo = getSelectionInfo(triggers, punctuation);
  if (
    !simpleKey ||
    (!wordChar && !isTrigger) ||
    !selectionInfo ||
    metaKey ||
    ctrlKey
  ) {
    return false;
  }
  const {
    node,
    offset,
    isTextNode,
    textContent,
    prevNode,
    nextNode,
    wordCharAfterCursor,
    cursorAtStartOfNode,
    cursorAtEndOfNode,
  } = selectionInfo;
  if (isTextNode && cursorAtStartOfNode && $isBeautifulMentionNode(prevNode)) {
    node.insertBefore($createTextNode(" "));
    return true;
  }
  if (isTextNode && cursorAtEndOfNode && $isBeautifulMentionNode(nextNode)) {
    node.insertAfter($createTextNode(" "));
    return true;
  }
  if (isTextNode && isTrigger && wordCharAfterCursor) {
    const content =
      textContent.substring(0, offset) + " " + textContent.substring(offset);
    node.setTextContent(content);
    return true;
  }
  if ($isBeautifulMentionNode(node) && nextNode === null) {
    node.insertAfter($createTextNode(" "));
    return true;
  }
  return false;
}
