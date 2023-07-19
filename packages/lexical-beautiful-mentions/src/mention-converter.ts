import { $createTextNode, LexicalNode } from "lexical";
import { $createBeautifulMentionNode } from "./MentionNode";
import {
  DEFAULT_PUNCTUATION,
  LENGTH_LIMIT,
  TRIGGERS,
  VALID_CHARS,
} from "./mention-utils";

interface MentionEntry {
  type: "mention";
  trigger: string;
  value: string;
}

interface TextEntry {
  type: "text";
  value: string;
}

type Entry = MentionEntry | TextEntry;

function findMentions(text: string, triggers: string[], punctuation: string) {
  const regex = new RegExp(
    TRIGGERS(triggers) +
      "((?:" +
      VALID_CHARS(triggers, punctuation) +
      "){1," +
      LENGTH_LIMIT +
      "})",
    "g",
  );
  const matches: { value: string; index: number }[] = [];
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
    });
  }
  return matches;
}

export function convertToMentionEntries(
  text: string,
  triggers: string[],
  punctuation: string,
): Entry[] {
  const matches = findMentions(text, triggers, punctuation);

  const result: Entry[] = [];
  let lastIndex = 0;

  matches.forEach(({ value, index }) => {
    // Add text before mention
    if (index > lastIndex) {
      const textBeforeMention = text.substring(lastIndex, index);
      result.push({ type: "text", value: textBeforeMention });
    }
    // Add mention
    const triggerRegExp = triggers.find((trigger) =>
      new RegExp(trigger).test(value),
    );

    const match = triggerRegExp && value.match(new RegExp(triggerRegExp));
    if (!match) {
      // should never happen since we only find mentions with the given triggers
      throw new Error("No trigger found for mention");
    }
    const trigger = match[0];

    result.push({
      type: "mention",
      value: value.substring(trigger.length),
      trigger,
    });
    // Update lastIndex
    lastIndex = index + value.length;
  });

  // Add text after last mention
  if (lastIndex < text.length) {
    const textAfterMentions = text.substring(lastIndex);
    result.push({ type: "text", value: textAfterMentions });
  }

  return result;
}

/**
 * Utility function that takes a string and converts it to a list of mention
 * and text nodes.<br>
 * 🚨 Only works for mentions without spaces. Make sure to disable spaces via
 * the `allowSpaces` prop.
 */
export function convertToMentionNodes(
  text: string,
  triggers: string[],
  punctuation = DEFAULT_PUNCTUATION,
) {
  const entries = convertToMentionEntries(text, triggers, punctuation);
  const nodes: LexicalNode[] = [];
  for (const entry of entries) {
    if (entry.type === "text") {
      nodes.push($createTextNode(entry.value));
    } else {
      nodes.push($createBeautifulMentionNode(entry.trigger, entry.value));
    }
  }
  return nodes;
}
