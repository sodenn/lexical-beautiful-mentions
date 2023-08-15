import { CreateEditorArgs, createEditor } from "lexical";
import { describe, expect, test } from "vitest";
import {
  $createBeautifulMentionNode,
  BeautifulMentionNode,
} from "./MentionNode";

const editorConfig: CreateEditorArgs = {
  nodes: [BeautifulMentionNode],
};

export function exportJSON(
  trigger: string,
  value: string,
  data?: { [p: string]: string | boolean | number },
) {
  let node: BeautifulMentionNode | undefined = undefined;
  const editor = createEditor(editorConfig);
  editor.update(() => {
    node = $createBeautifulMentionNode(trigger, value, data);
  });
  if (!node) {
    throw new Error("Node is undefined");
  }
  return (node as BeautifulMentionNode).exportJSON();
}

describe("BeautifulMentionNode", () => {
  test("should include a data prop when exporting to JSON and data is provided when creating the node", () => {
    const node = exportJSON("@", "Jane", {
      email: "jane@example.com",
    });
    expect(node).toStrictEqual({
      trigger: "@",
      type: "beautifulMention",
      value: "Jane",
      data: {
        email: "jane@example.com",
      },
      version: 1,
    });
  });

  test("should not include a data prop when exporting to JSON if no data is provided when creating the node", () => {
    const node = exportJSON("@", "Jane");
    expect(node).toStrictEqual({
      trigger: "@",
      type: "beautifulMention",
      value: "Jane",
      version: 1,
    });
  });
});
