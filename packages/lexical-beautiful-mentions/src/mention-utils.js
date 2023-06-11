import { $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, } from "lexical";
import { $createBeautifulMentionNode } from "./MentionNode";
const PUNCTUATION = "\\.,\\*\\?\\$\\|#{}\\(\\)\\^\\[\\]\\\\/!%'\"~=<>_:;\\s";
// Strings that can trigger the mention menu.
export const TRIGGERS = (triggers) => "(?:" + triggers.join("|") + ")";
// Chars we expect to see in a mention (non-space, non-punctuation).
export const VALID_CHARS = (triggers) => "(?!" + triggers.join("|") + ")[^" + PUNCTUATION + "]";
// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS = "(?:" +
    "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
    "[" +
    PUNCTUATION +
    "]|" + // E.g. "-' in "Salier-Hellendag"
    ")";
export const LENGTH_LIMIT = 75;
// Regex used to trigger the mention menu.
function createMentionsRegex(triggers, allowSpaces) {
    return new RegExp("(^|\\s|\\()(" +
        TRIGGERS(triggers) +
        "((?:" +
        VALID_CHARS(triggers) +
        (allowSpaces ? VALID_JOINS : "") +
        "){0," +
        LENGTH_LIMIT +
        "})" +
        ")$");
}
export function checkForMentions(text, triggers, allowSpaces) {
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
export function isWordChar(char, triggers) {
    return new RegExp(VALID_CHARS(triggers)).test(char);
}
export function getSelectionInfo(triggers) {
    const selection = $getSelection();
    if (!selection || !$isRangeSelection(selection)) {
        return;
    }
    const anchor = selection.anchor;
    const focus = selection.focus;
    const nodes = selection.getNodes();
    if (anchor.key !== focus.key ||
        anchor.offset !== focus.offset ||
        nodes.length === 0) {
        return;
    }
    const [node] = nodes;
    const isTextNode = $isTextNode(node) && node.isSimpleText();
    const offset = anchor.offset || 0;
    const textContent = node.getTextContent();
    const cursorAtStartOfNode = offset === 0;
    const cursorAtEndOfNode = textContent.length === offset;
    const charBeforeCursor = textContent.charAt(offset - 1);
    const charAfterCursor = textContent.charAt(offset);
    const wordCharBeforeCursor = isWordChar(charBeforeCursor, triggers);
    const wordCharAfterCursor = isWordChar(charAfterCursor, triggers);
    const prevNode = node.getPreviousSibling();
    const nextNode = node.getNextSibling();
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
export function insertMention(triggers, trigger, value) {
    const selectionInfo = getSelectionInfo(triggers);
    if (!selectionInfo) {
        return false;
    }
    const { node, offset, selection, wordCharBeforeCursor, wordCharAfterCursor, cursorAtStartOfNode, cursorAtEndOfNode, prevNode, nextNode, } = selectionInfo;
    // Insert a mention node or a text node with the trigger to open the mention menu.
    const mentionNode = value
        ? $createBeautifulMentionNode(trigger, value)
        : $createTextNode(trigger);
    // Insert a mention with a leading space if the node at the cursor is not a text node.
    if (!($isParagraphNode(node) && offset === 0) && !$isTextNode(node)) {
        selection.insertNodes([$createTextNode(" "), mentionNode]);
        return true;
    }
    let spaceNode = null;
    const nodes = [];
    if (wordCharBeforeCursor ||
        (cursorAtStartOfNode && prevNode !== null && !$isTextNode(prevNode))) {
        nodes.push($createTextNode(" "));
    }
    nodes.push(mentionNode);
    if (wordCharAfterCursor ||
        (cursorAtEndOfNode && nextNode !== null && !$isTextNode(nextNode))) {
        spaceNode = $createTextNode(" ");
        nodes.push(spaceNode);
    }
    selection.insertNodes(nodes);
    if (nodes.length > 1) {
        if ($isTextNode(mentionNode)) {
            mentionNode.select();
        }
        else if (spaceNode) {
            spaceNode.selectPrevious();
        }
    }
    return true;
}
