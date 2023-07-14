import { MenuTextMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalNode,
} from "lexical";

const PUNCTUATION = "\\.,\\*\\?\\$\\|#{}\\(\\)\\^\\[\\]\\\\/!%'\"~=<>_:;\\s";

// Strings that can trigger the mention menu.
export const TRIGGERS = (triggers: string[]) =>
  "(?:" + triggers.join("|") + ")";

// Chars we expect to see in a mention (non-space, non-punctuation).
export const VALID_CHARS = (triggers: string[]) =>
  "(?!" + triggers.join("|") + ")[^" + PUNCTUATION + "]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  "[" +
  PUNCTUATION +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

export const LENGTH_LIMIT = 75;

// Regex used to trigger the mention menu.
function createMentionsRegex(triggers: string[], allowSpaces: boolean) {
  return new RegExp(
    "(^|\\s|\\()(" +
      TRIGGERS(triggers) +
      "((?:" +
      VALID_CHARS(triggers) +
      (allowSpaces ? VALID_JOINS : "") +
      "){0," +
      LENGTH_LIMIT +
      "})" +
      ")$",
  );
}

export function checkForMentions(
  text: string,
  triggers: string[],
  allowSpaces: boolean,
): MenuTextMatch | null {
  const match = createMentionsRegex(triggers, allowSpaces).exec(text);
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1];
    const matchingStringWithTrigger = match[2];
    const matchingString = match[3];
    if (matchingStringWithTrigger.length >= 1) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString: matchingString,
        replaceableString: matchingStringWithTrigger,
      };
    }
  }
  return null;
}

export function isWordChar(char: string, triggers: string[]) {
  return new RegExp(VALID_CHARS(triggers)).test(char);
}

export function getSelectionInfo(triggers: string[]) {
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

  const [node] = nodes;
  const isTextNode = $isTextNode(node) && node.isSimpleText();
  const offset = anchor.type === "text" ? anchor.offset : 0;
  const textContent = node.getTextContent();
  const cursorAtStartOfNode = offset === 0;
  const cursorAtEndOfNode = textContent.length === offset;
  const charBeforeCursor = textContent.charAt(offset - 1);
  const charAfterCursor = textContent.charAt(offset);
  const wordCharBeforeCursor = isWordChar(charBeforeCursor, triggers);
  const wordCharAfterCursor = isWordChar(charAfterCursor, triggers);
  const prevNode = getPreviousSibling(node);
  const nextNode = getNextSibling(node);

  return {
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
  };
}

export function getNextSibling(node: LexicalNode) {
  let nextSibling = node.getNextSibling();
  while (nextSibling !== null && nextSibling.getType() === "zeroWidth") {
    nextSibling = nextSibling.getNextSibling();
  }
  return nextSibling;
}

export function getPreviousSibling(node: LexicalNode) {
  let previousSibling = node.getPreviousSibling();
  while (
    previousSibling !== null &&
    previousSibling.getType() === "zeroWidth"
  ) {
    previousSibling = previousSibling.getPreviousSibling();
  }
  return previousSibling;
}
