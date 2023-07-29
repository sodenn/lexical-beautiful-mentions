import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Mentions Menu", () => {
  test("should open the menu before a comma", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "Hey, are you there?",
    });
    await utils.moveCursorForward(3);
    await utils.editor.type(" @");
    await utils.hasText("Hey @, are you there?");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.mentionsMenu.getByText("Catherine").click();
    await utils.hasText("Hey [@Catherine], are you there?");
  });

  test("should filter suggestions after a new mention was added", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      creatable: true,
      initialValue: "Hey @lisa",
    });
    await utils.editor.type(" @ant");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(2);
    await expect(utils.mentionsMenu.getByText("Anton")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add user "ant"`)).toBeVisible();
    await utils.hasText("Hey [@lisa] @ant");
  });

  test("should not show the option to add a new mention if it already exists", async ({
    page,
  }) => {
    const utils = await testUtils(page, { creatable: true });
    await utils.editor.type("@Anton");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.mentionsMenu.getByText("Anton")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add "ant"`)).not.toBeVisible();
  });

  test("should not show the option to add a new mention if disabled", async ({
    page,
  }) => {
    const utils = await testUtils(page, { creatable: false });
    await utils.editor.type("@abc");
    await expect(utils.mentionsMenu).toHaveCount(0);
  });

  test("should dynamically position the menu", async ({ page }) => {
    const utils = await testUtils(page, {
      initialValue:
        "Hey @John, the task is #urgent and due:tomorrow at 2pm #meeting",
    });
    await utils.editor.type(" @ant");
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });
  });

  test("should insert the entered text as mention when the editor is blurred", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      insertOnBlur: true,
      creatable: true,
    });
    await utils.editor.type("@abc");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@abc]");
  });

  test("should insert the selected mention when the editor is blurred", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      insertOnBlur: true,
      creatable: true,
    });
    await utils.editor.type("@Gi");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Gina]");
  });

  test("should insert a selected mention by pressing enter", async ({
    page,
  }) => {
    const utils = await testUtils(page);
    await utils.editor.type("@b");
    await utils.sleep(200);
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("Enter");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Boris]");
  });

  test("should insert a selected mention by pressing tab", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(page);
    await utils.editor.type("@");
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Anton]");
  });

  test("should close the menu when pressing escape", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(page);
    await utils.editor.type("@");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("Escape");
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should not insert the entered text as mention when the editor is blurred", async ({
    page,
  }) => {
    const utils = await testUtils(page, { insertOnBlur: false });
    await utils.editor.type("@abc");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("@abc");
    await utils.focusEnd();
    await utils.editor.type(" abc");
    await utils.hasText("@abc abc");
  });

  test("should not insert a mention when the editor is blurred if there is only a trigger without text", async ({
    page,
  }) => {
    const utils = await testUtils(page);
    await utils.editor.type("@");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("@");
  });

  test("should insert a new mention with a regex based trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      creatable: true,
      autofocus: "start",
    });
    await utils.editor.type("abc:b");
    await expect(utils.mentionsMenu.getByText(`Add "b"`)).toBeVisible();
    await utils.mentionsMenu.getByText(`Add "b"`).click();
    await utils.hasText("[abc:b]");
  });

  test("should display a loading indicator while fetching suggestions", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      asynchronous: true,
    });
    await utils.editor.type("@");
    await expect(page.getByText("Loading...")).toBeVisible();
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(5);
    await expect(page.getByText("Loading...")).not.toBeVisible();
  });

  test("should how existing mentions from the editor as suggestions", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      creatable: true,
    });
    await utils.editor.type("abc:a");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await utils.mentionsMenu.getByText(`Add "a"`).click();
    await utils.hasText("[abc:a]");
    await utils.editor.type("abc:");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.mentionsMenu.getByText("a")).toBeVisible();
    await utils.editor.press("Enter");
    await utils.hasText("[abc:a] [abc:a]");
  });

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
