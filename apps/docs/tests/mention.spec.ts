import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("mentions handling", () => {
  test("should display the mentions menu after deleting a mention", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John",
      showMentionsOnDelete: true,
    });
    await utils.editor.press("Backspace");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("B");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await utils.hasText("Hey [@Boris]");
  });

  test("should not display the mentions menu after deleting a mention when the option is disabled", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John",
    });
    await utils.editor.press("Backspace");
    await utils.sleep(200);
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should display the mentions menu after deleting a mention in the middle of a sentence", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John how are you doing?",
      showMentionsOnDelete: true,
    });
    await utils.moveCursorForward(6);
    await utils.editor.press("Backspace");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("B");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await utils.hasText("Hey [@Boris] how are you doing?");
  });
});
