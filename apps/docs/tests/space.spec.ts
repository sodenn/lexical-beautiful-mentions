import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Space handling", () => {
  test("should delete a text with mentions", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await utils.deleteText(utils.initialValue.length);
    await utils.hasText("");
  });

  test("should add a character after the last mention", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @catherine",
    });
    await utils.editor.press("x");
    await utils.hasText("Hey [@catherine] x");
  });

  test("should add a character before a mention", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      initialValue: "Hey @John",
    });
    await utils.moveCursorBackward(2);
    await utils.editor.press("x");
    await utils.hasText("Hey x [@John]");
  });

  test("should add a character after a mention", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "@catherine is a nice person",
    });
    await utils.moveCursorForward(2);
    await utils.editor.press("x");
    await utils.hasText("[@catherine] x is a nice person");
  });

  test("should add a trigger character after a mention", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await utils.moveCursorBackward(7);
    await utils.editor.press("@");
    await utils.hasText(
      "Hey [@John], the task is [#urgent] @ and [due:tomorrow]",
    );
  });

  test("should add a trigger character before text", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await utils.moveCursorBackward(6);
    await utils.editor.press("@");
    await utils.hasText(
      "Hey [@John], the task is [#urgent] @ and [due:tomorrow]",
    );
  });

  test("should delete the first of two mention that are only linked with a single space", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      initialValue: "#urgent #important #task",
    });
    await utils.moveCursorBackward(2);
    await utils.deleteText(2);
    await utils.hasText("[#urgent] [#task]");
  });

  test("should not insert any space if the meta key is pressed", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
      initialValue: "#urgent #task",
    });
    await utils.moveCursorBackward(2);
    await utils.editor.press("Meta+C");
    await utils.hasText("[#urgent] [#task]");
  });

  test("should not insert a space between a word", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "and",
    });
    await utils.moveCursorForward(1);
    await utils.editor.press("x");
    await utils.hasText("axnd");
  });

  test("should not add a space at the beginning of the editor", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      autofocus: "end",
    });
    await page.getByText("Insert Mention").click();
    await utils.hasText("[#work]");
  });

  test("should not insert a space before a word", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "and",
    });
    await utils.editor.press("x");
    await utils.hasText("xand");
  });

  test("should insert a new mention when pressing space", async ({ page }) => {
    const utils = await testUtils(page, {
      creatable: true,
      autofocus: "start",
    });
    await utils.editor.type("#xxx");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.mentionsMenu.getByText(`Add tag "xxx"`)).toBeVisible();
    await utils.editor.press("Space");
    await utils.hasText("[#xxx] ");
  });

  test("should insert a new mention with dashes", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "due:2023-06-06",
    });
    await utils.hasText("[due:2023-06-06]");
  });
});
