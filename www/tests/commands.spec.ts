import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Open Suggestions", () => {
  test("should open the menu at the end of the editor", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await expect(utils.mentionsMenu).not.toBeVisible();
    await page.getByText("Open Suggestions").click();
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] @",
    );
  });

  test("should open the menu even if the editor was never focused", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "none",
        initialValue: "Hey",
      },
    );
    await expect(utils.mentionsMenu).not.toBeVisible();
    await page.getByText("Open Suggestions").click();
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.hasText("Hey @");
  });

  test("should open the menu at the start of the editor", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "start",
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await page.getByText("Open Suggestions").click();
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.hasText(
      "@ Hey [@John], the task is [#urgent] and [due:tomorrow]",
    );
  });

  test("should open the menu after a word", async ({ page, browserName }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "start",
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await utils.moveCursorForward(3);
    await page.getByText("Open Suggestions").click();
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.hasText(
      "Hey @ [@John], the task is [#urgent] and [due:tomorrow]",
    );
  });

  test("should open the menu before a mention", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "start",
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await utils.moveCursorForward(4);
    await page.getByText("Open Suggestions").click();
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.hasText(
      "Hey @ [@John], the task is [#urgent] and [due:tomorrow]",
    );
  });
});

test.describe("Rename mentions", () => {
  test("should rename an mention", async ({ page, browserName, isMobile }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await page.getByText("Rename Mention").click();
    await utils.hasText("Hey [@John], the task is [#urgent] and [due:today]");
    if (!isMobile) {
      await expect(utils.editor).toBeFocused();
    }
  });

  test("should rename an mention even if the editor was never focused", async ({
    page,
    browserName,
    isMobile,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "none",
        initialValue: "due:tomorrow",
      },
    );
    await page.getByText("Rename Mention").click();
    await utils.hasText("[due:today]");
    if (!isMobile) {
      await expect(utils.editor).toBeFocused();
    }
  });
});

test.describe("Remove mentions", () => {
  test("should remove a mention from the editor", async ({
    page,
    browserName,
    isMobile,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await page.getByText("Remove Mention").click();
    await utils.countMentions(2);
    if (!isMobile) {
      await expect(utils.editor).toBeFocused();
    }
  });

  test("should also remove trailing spaces when removing a mention ", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John",
      },
    );
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
    await utils.hasText("Hey");
  });

  test("should prevent double spaces when removing a mention", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "The #task is important",
      },
    );
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
    await utils.hasText("The is important");
  });

  test("should remove a mention even if the editor was never focused", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "none",
        initialValue: "This is due:tomorrow and urgent",
      },
    );
    await utils.countMentions(1);
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
  });
});

test.describe("Insert mention", () => {
  test("should insert a new mention", async ({ page, browserName }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await page.getByText("Insert Mention").click();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] [#work]",
    );
    await expect(utils.editor).toBeFocused();
  });

  test("should insert a new mention without focus the editor", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        commandFocus: false,
        initialValue: "",
      },
    );
    await page.getByText("Insert Mention").click();
    await utils.hasText("[#work]");
    await expect(utils.editor).not.toBeFocused();
  });

  test("should insert a new mention even if the editor is not focused", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John, the task is #urgent and due:tomorrow",
      },
    );
    await page.getByText("Insert Mention").click();
    await utils.hasText(
      "Hey [@John], the task is [#urgent] and [due:tomorrow] [#work]",
    );
  });

  test("should insert multiple mention one after the other", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "",
        commandFocus: false,
      },
    );
    await page.getByText("Insert Mention").click();
    await utils.sleep(100);
    await page.getByText("Insert Mention").click();
    await utils.hasText("[#work] [#work]");
  });

  test("should insert a new mention even if the editor was never focused", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "none",
        initialValue: "Do your",
      },
    );
    await page.getByText("Insert Mention").click();
    await utils.hasText("Do your [#work]");
  });

  test("should insert a new mention while another mention is selected", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        initialValue: "Hello @Boris",
      },
    );
    // add another mention
    await utils.editorType("@Catherine");
    await utils.editor.press("Enter");
    // remove it again
    await utils.editor.press("Backspace");
    await utils.editor.press("Backspace");
    // select the first mention
    await utils.moveCursorBackward(1);
    // insert a new mention
    await page.getByText("Insert Mention").click();
    await utils.hasText("Hello [@Boris] [#work]");
  });
});
