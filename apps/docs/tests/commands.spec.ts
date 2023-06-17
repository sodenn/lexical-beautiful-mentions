import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Open Suggestions", () => {
  test("should open the menu at the end of the editor", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await expect(utils.menu).not.toBeVisible();
    await page.getByText("Open Suggestions").click();
    await expect(utils.menu).toBeVisible();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] @"
    );
  });

  test("should open the menu at the start of the editor", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await page.getByText("Open Suggestions").click();
    await expect(utils.menu).toBeVisible();
    await utils.hasText(
      "@ Hey [@John], the task is [#urgent] and [due:tomorrow]"
    );
  });

  test("should open the menu after a word", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await utils.moveCursorForward(3);
    await page.getByText("Open Suggestions").click();
    await expect(utils.menu).toBeVisible();
    await utils.hasText(
      "Hey @ [@John], the task is [#urgent] and [due:tomorrow]"
    );
  });

  test("should open the menu before a mention", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await utils.moveCursorForward(4);
    await page.getByText("Open Suggestions").click();
    await expect(utils.menu).toBeVisible();
    await utils.hasText(
      "Hey @ [@John], the task is [#urgent] and [due:tomorrow]"
    );
  });
});

test.describe("Rename mentions", () => {
  test("should rename an mention", async ({ page, isMobile }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await page.getByText("Rename Mention").click();
    await utils.hasText("Hey [@John], the task is [#urgent] and [due:today]");
    if (!isMobile) {
      await expect(utils.editor).toBeFocused();
    }
  });
});

test.describe("Remove mentions", () => {
  test("should remove a mention from the editor", async ({
    page,
    isMobile,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await page.getByText("Remove Mention").click();
    await utils.countMentions(2);
    if (!isMobile) {
      await expect(utils.editor).toBeFocused();
    }
  });

  test("should also remove trailing spaces when removing a mention ", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John",
    });
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
    await utils.hasText("Hey");
  });

  test("should prevent double spaces when removing a mention", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "The #task is important",
    });
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
    await utils.hasText("The is important");
  });
});

test.describe("Insert mention", () => {
  test("should insert a new mention", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await page.getByText("Insert Mention").click();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] [#work]"
    );
    await expect(utils.editor).toBeFocused();
  });

  test("should insert a new mention without focus the editor", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      commandFocus: false,
      initialValue: "",
    });
    await page.getByText("Insert Mention").click();
    await utils.hasText("[#work]");
    await expect(utils.editor).not.toBeFocused();
  });

  test("should insert a new mention even if the editor is not focused", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "Hey @John, the task is #urgent and due:tomorrow",
    });
    await page.getByText("Insert Mention").click();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] [#work]"
    );
  });

  test("should insert multiple mention one after the other", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      initialValue: "",
      commandFocus: false,
    });
    await page.getByText("Insert Mention").click();
    await utils.sleep(100);
    await page.getByText("Insert Mention").click();
    await utils.hasText("[#work] [#work]");
  });
});
