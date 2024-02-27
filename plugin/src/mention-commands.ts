import {
  $createTextNode,
  $isParagraphNode,
  $isTextNode,
  $nodesOfType,
  createCommand,
  LexicalCommand,
  LexicalNode,
  TextNode,
} from "lexical";
import { BeautifulMentionsItemData } from "./BeautifulMentionsPluginProps";
import {
  $getSelectionInfo,
  $selectEnd,
  getNextSibling,
  getPreviousSibling,
  getTextContent,
} from "./mention-utils";
import {
  $createBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";

export interface InsertMention {
  /**
   * The trigger that was used to insert the mention.
   */
  trigger: string;
  /**
   * The value to insert after the trigger.
   */
  value: string;
  /**
   * Whether to focus the editor after inserting the mention.
   * @default true
   */
  focus?: boolean;
  /**
   * The data to associate with the mention.
   */
  data?: { [key: string]: BeautifulMentionsItemData };
}

export interface RemoveMentions {
  /**
   * The trigger to search for when removing mentions.
   */
  trigger: string;
  /**
   * An optional value to search for when removing mentions.
   */
  value?: string;
  /**
   * Whether to focus the editor after removing the mention.
   * @default true
   */
  focus?: boolean;
}

export interface RenameMentions {
  /**
   * The trigger to search for when renaming mentions.
   */
  trigger: string;
  /**
   * The new value to replace the old value with.
   */
  newValue: string;
  /**
   * An optional value to search for when renaming mentions.
   */
  value?: string;
  /**
   * Whether to focus the editor after renaming the mention.
   * @default true
   */
  focus?: boolean;
}

export interface HasMentions {
  /**
   * The trigger to search for when checking for mentions.
   */
  trigger: string;
  /**
   * An optional value to search for when checking for mentions.
   */
  value?: string;
}

export interface OpenMentionMenu {
  /**
   * The trigger to insert when opening the mention menu.
   */
  trigger: string;
}

export const INSERT_MENTION_COMMAND: LexicalCommand<InsertMention> =
  createCommand("INSERT_MENTION_COMMAND");

export const REMOVE_MENTIONS_COMMAND: LexicalCommand<RemoveMentions> =
  createCommand("REMOVE_MENTIONS_COMMAND");

export const RENAME_MENTIONS_COMMAND: LexicalCommand<RenameMentions> =
  createCommand("RENAME_MENTIONS_COMMAND");

export const OPEN_MENTION_MENU_COMMAND: LexicalCommand<OpenMentionMenu> =
  createCommand("OPEN_MENTION_MENU_COMMAND");

export function $insertTriggerAtSelection(
  triggers: string[],
  punctuation: string,
  trigger: string,
) {
  return $insertMentionOrTrigger(triggers, punctuation, trigger);
}

export function $insertMentionAtSelection(
  triggers: string[],
  punctuation: string,
  trigger: string,
  value: string,
  data?: { [key: string]: BeautifulMentionsItemData },
) {
  return $insertMentionOrTrigger(triggers, punctuation, trigger, value, data);
}

function $insertMentionOrTrigger(
  triggers: string[],
  punctuation: string,
  trigger: string,
  value?: string,
  data?: { [key: string]: BeautifulMentionsItemData },
) {
  const selectionInfo = $getSelectionInfo(triggers, punctuation);
  if (!selectionInfo) {
    return false;
  }

  const {
    node,
    offset,
    selection,
    wordCharBeforeCursor,
    wordCharAfterCursor,
    cursorAtStartOfNode,
    cursorAtEndOfNode,
    prevNode,
    nextNode,
  } = selectionInfo;

  // Insert a mention node or a text node with the trigger to open the mention menu.
  const mentionNode = value
    ? $createBeautifulMentionNode(trigger, value, data)
    : $createTextNode(trigger);

  // Insert a mention with a leading space if the node at the cursor is not a text node.
  if (!($isParagraphNode(node) && offset === 0) && !$isTextNode(node)) {
    selection.insertNodes([$createTextNode(" "), mentionNode]);
    return true;
  }

  let spaceNode: TextNode | null = null;
  const nodes: LexicalNode[] = [];
  if (
    wordCharBeforeCursor ||
    (cursorAtStartOfNode && prevNode !== null && !$isTextNode(prevNode))
  ) {
    nodes.push($createTextNode(" "));
  }
  nodes.push(mentionNode);
  if (
    wordCharAfterCursor ||
    (cursorAtEndOfNode && nextNode !== null && !$isTextNode(nextNode))
  ) {
    spaceNode = $createTextNode(" ");
    nodes.push(spaceNode);
  }

  selection.insertNodes(nodes);

  if (nodes.length > 1) {
    if ($isTextNode(mentionNode)) {
      mentionNode.select();
    } else if (spaceNode) {
      spaceNode.selectPrevious();
    }
  }

  return true;
}

export function $removeMention(trigger: string, value?: string, focus = true) {
  let removed = false;
  let prev: LexicalNode | null = null;
  let next: LexicalNode | null = null;
  const mentions = $nodesOfType(BeautifulMentionNode);
  for (const mention of mentions) {
    const sameTrigger = mention.getTrigger() === trigger;
    const sameValue = mention.getValue() === value;
    if (sameTrigger && (sameValue || !value)) {
      prev = getPreviousSibling(mention);
      next = getNextSibling(mention);
      mention.remove();
      removed = true;
      // Prevent double spaces
      if (
        $isTextNode(prev) &&
        getTextContent(prev).endsWith(" ") &&
        next &&
        getTextContent(next).startsWith(" ")
      ) {
        prev.setTextContent(getTextContent(prev).slice(0, -1));
      }
      // Remove trailing space
      if (
        next === null &&
        $isTextNode(prev) &&
        getTextContent(prev).endsWith(" ")
      ) {
        prev.setTextContent(getTextContent(prev).trimEnd());
      }
    }
  }
  if (removed && focus) {
    focusEditor(prev, next);
  }
  return removed;
}

export function $renameMention(
  trigger: string,
  newValue: string,
  value?: string,
  focus = true,
) {
  const mentions = $nodesOfType(BeautifulMentionNode);
  let renamedMention: BeautifulMentionNode | null = null;
  for (const mention of mentions) {
    const sameTrigger = mention.getTrigger() === trigger;
    const sameValue = mention.getValue() === value;
    if (sameTrigger && (sameValue || !value)) {
      renamedMention = mention;
      mention.setValue(newValue);
    }
  }
  if (renamedMention && focus) {
    const prev = getPreviousSibling(renamedMention);
    const next = getNextSibling(renamedMention);
    focusEditor(prev, next);
    if (next && $isTextNode(next)) {
      next.select(0, 0);
    } else {
      $selectEnd();
    }
  }
  return renamedMention !== null;
}

function focusEditor(prev: LexicalNode | null, next: LexicalNode | null) {
  if (next && $isTextNode(next)) {
    next.select(0, 0);
  } else if (prev && $isTextNode(prev)) {
    prev.select();
  } else {
    $selectEnd();
  }
}
