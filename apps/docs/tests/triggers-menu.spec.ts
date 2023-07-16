import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Triggers Menu", () => {
  test("should open the triggers menu when pressing ctrl+space", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      showTriggers: true,
    });
    await utils.editor.press("Control+Space");
    await expect(utils.triggersMenu).toBeVisible();
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.type("Ant");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await utils.hasText("[@Anton]");
  });

  test("should open the triggers menu when pressing slash", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey ",
      showTriggers: true,
      autofocus: "end",
    });
    await utils.editor.press("Slash");
    await expect(utils.triggersMenu).toBeVisible();
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.type("Ant");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await utils.hasText("Hey [@Anton]");
  });

  test("should open the triggers menu in the middle of a sentence", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey  what's up?",
      showTriggers: true,
      autofocus: "start",
    });
    await utils.moveCursorForward(4);
    await utils.editor.press("Slash");
    await expect(utils.triggersMenu).toBeVisible();
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.type("Ant");
    await utils.sleep(200);
    await utils.editor.press("Enter");
    await utils.hasText("Hey [@Anton] what's up?");
  });

  test("should open the triggers menu when starting to type", async ({
    page,
  }) => {
    const utils = await testUtils(page, { showTriggers: true });
    await expect(utils.triggersMenu).not.toBeVisible();
    await utils.editor.press("r");
    await utils.sleep(300);
    await expect(utils.triggersMenu).toBeVisible();
  });

  test("should open the triggers menu when starting to type multiple characters", async ({
    page,
  }) => {
    const utils = await testUtils(page, { showTriggers: true });
    await expect(utils.triggersMenu).not.toBeVisible();
    await utils.editor.type("du");
    await utils.sleep(300);
    await expect(utils.triggersMenu).toBeVisible();
    await utils.editor.press("Enter");
    await utils.hasText("due:");
  });

  test("should not open the triggers menu when option is disabled", async ({
    page,
  }) => {
    const utils = await testUtils(page);
    await utils.editor.press("Control+Space");
    await utils.sleep(300);
    await expect(utils.triggersMenu).not.toBeVisible();
  });

  test("should not open the triggers when starting to type without using a trigger character", async ({
    page,
  }) => {
    const utils = await testUtils(page, { showTriggers: true });
    await expect(utils.triggersMenu).not.toBeVisible();
    await utils.editor.press("a");
    await utils.sleep(300);
    await expect(utils.triggersMenu).not.toBeVisible();
  });
});
