import { describe, expect, it } from "vitest";
import { convertToMentionEntries } from "./mention-converter";
import { DEFAULT_PUNCTUATION } from "./mention-utils";

describe("mention-utils", () => {
  it("should find mention entries in text", () => {
    const triggers = ["@", "due:", "#"];
    const text = "Hey @john, the task is #urgent and due:tomorrow";
    const entries = convertToMentionEntries(
      text,
      triggers,
      DEFAULT_PUNCTUATION,
    );

    expect(entries.length).toBe(6);

    expect(entries[0].type).toBe("text");
    expect(entries[0].value).toBe("Hey ");

    expect(entries[1].type).toBe("mention");
    if (entries[1].type === "mention") {
      expect(entries[1].trigger).toBe("@");
      expect(entries[1].value).toBe("john");
    }

    expect(entries[2].type).toBe("text");
    expect(entries[2].value).toBe(", the task is ");

    expect(entries[3].type).toBe("mention");
    if (entries[3].type === "mention") {
      expect(entries[3].trigger).toBe("#");
      expect(entries[3].value).toBe("urgent");
    }

    expect(entries[4].type).toBe("text");
    expect(entries[4].value).toBe(" and ");

    expect(entries[5].type).toBe("mention");
    if (entries[5].type === "mention") {
      expect(entries[5].trigger).toBe("due:");
      expect(entries[5].value).toBe("tomorrow");
    }
  });

  it("should find multiple mentions with the same trigger", () => {
    const triggers = ["@", "due:", "#"];
    const text = "Hey @john and @jane.";
    const entries = convertToMentionEntries(
      text,
      triggers,
      DEFAULT_PUNCTUATION,
    );

    expect(entries.length).toBe(5);

    expect(entries[0].type).toBe("text");
    expect(entries[0].value).toBe("Hey ");

    expect(entries[1].type).toBe("mention");
    if (entries[1].type === "mention") {
      expect(entries[1].trigger).toBe("@");
      expect(entries[1].value).toBe("john");
    }

    expect(entries[2].type).toBe("text");
    expect(entries[2].value).toBe(" and ");

    expect(entries[3].type).toBe("mention");
    if (entries[3].type === "mention") {
      expect(entries[3].trigger).toBe("@");
      expect(entries[3].value).toBe("jane");
    }
  });

  it("should ignore triggers without a value", () => {
    const triggers = ["@", "#"];
    const text = "Hey @ john and # jane.";
    const entries = convertToMentionEntries(
      text,
      triggers,
      DEFAULT_PUNCTUATION,
    );
    expect(entries.length).toBe(1);
    expect(entries[0].type).toBe("text");
  });

  it("should ignore triggers in the middle of a word", () => {
    const triggers = ["@"];
    const text = "test@example.com @hello";
    const entries = convertToMentionEntries(
      text,
      triggers,
      DEFAULT_PUNCTUATION,
    );
    expect(entries.length).toBe(2);
    expect(entries[0].type).toBe("text");
    expect(entries[0].value).toBe("test@example.com ");
    expect(entries[1].type).toBe("mention");
    if (entries[1].type === "mention") {
      expect(entries[1].trigger).toBe("@");
      expect(entries[1].value).toBe("hello");
    }
  });

  it("should find mentions in brackets", () => {
    const triggers = ["@"];
    const text = "Hey (@john)";
    const entries = convertToMentionEntries(
      text,
      triggers,
      DEFAULT_PUNCTUATION,
    );
    expect(entries.length).toBe(3);
    expect(entries[0].type).toBe("text");
    expect(entries[0].value).toBe("Hey (");
    expect(entries[1].type).toBe("mention");
    if (entries[1].type === "mention") {
      expect(entries[1].trigger).toBe("@");
      expect(entries[1].value).toBe("john");
    }
    expect(entries[2].type).toBe("text");
    expect(entries[2].value).toBe(")");
  });
});
