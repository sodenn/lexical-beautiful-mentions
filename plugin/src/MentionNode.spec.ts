import { CreateEditorArgs, createEditor } from "lexical";
import { describe, expect, test } from "vitest";
import { BeautifulMentionsItemData } from "./BeautifulMentionsPluginProps";
import {
  $createBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";

const editorConfig: CreateEditorArgs = {
  nodes: [BeautifulMentionNode],
};

export function exportJSON(
  trigger: string,
  triggerRegExp: string,
  value: string,
  data?: { [p: string]: BeautifulMentionsItemData },
) {
  let node: BeautifulMentionNode | undefined = undefined;
  const editor = createEditor(editorConfig);
  editor.update(() => {
    node = $createBeautifulMentionNode(trigger, triggerRegExp, value, data);
  });
  if (!node) {
    throw new Error("Node is undefined");
  }
  return (node as BeautifulMentionNode).exportJSON();
}

describe("BeautifulMentionNode", () => {
  test("should include a data prop when exporting to JSON and data is provided when creating the node", () => {
    const node = exportJSON("@", "@", "Jane", {
      email: "jane@example.com",
    });
    expect(node).toStrictEqual({
      trigger: "@",
      triggerRegExp: "@",
      type: "beautifulMention",
      value: "Jane",
      data: {
        email: "jane@example.com",
      },
      version: 1,
    });
  });

  test("should not include a data prop when exporting to JSON if no data is provided when creating the node", () => {
    const node = exportJSON("@", "@", "Jane");
    expect(node).toStrictEqual({
      trigger: "@",
      triggerRegExp: "@",
      type: "beautifulMention",
      value: "Jane",
      version: 1,
    });
  });

  test("should append a space to trigger if triggerRegExp ends with '\\s?' and trigger does not have a space", () => {
    const node = exportJSON("due", "due\\s?", "tomorrow");
    expect(node).toStrictEqual({
      trigger: "due ",
      triggerRegExp: "due\\s?",
      type: "beautifulMention",
      value: "tomorrow",
      version: 1,
    });
  });

  test('should not append a space to trigger if triggerRegExp ends with "\\s?" and trigger already has a space', () => {
    const node = exportJSON("due ", "due\\s?", "tomorrow");
    expect(node).toStrictEqual({
      trigger: "due ",
      triggerRegExp: "due\\s?",
      type: "beautifulMention",
      value: "tomorrow",
      version: 1,
    });
  });
});
