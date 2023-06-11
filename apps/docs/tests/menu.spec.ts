import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Menu", () => {
  test("should open the menu before a comma", async ({ page }) => {
    const utils = await testUtils(page, {
      autofocus: "start",
      initialValue: "Hey, are you there?",
    });
    await utils.moveCursorForward(3);
    await utils.editor.type(" @");
    await utils.hasText("Hey @, are you there?");
    await expect(utils.menu).toBeVisible();
    await utils.menu.getByText("Catherine").click();
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
    await expect(utils.menu.getByRole("menuitem")).toHaveCount(2);
    await expect(utils.menu.getByText("Anton")).toBeVisible();
    await expect(utils.menu.getByText(`Add "ant"`)).toBeVisible();
    await utils.hasText("Hey [@lisa] @ant");
  });

  test("should not show the option to add a new mention if it already exists", async ({
    page,
  }) => {
    const utils = await testUtils(page, { creatable: true });
    await utils.editor.type("@Anton");
    await expect(utils.menu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.menu.getByText("Anton")).toBeVisible();
    await expect(utils.menu.getByText(`Add "ant"`)).not.toBeVisible();
  });

  test("should not show the option to add a new mention if disabled", async ({
    page,
  }) => {
    const utils = await testUtils(page, { creatable: false });
    await utils.editor.type("@abc");
    await expect(utils.menu).toHaveCount(0);
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

  test("should insert the entered text as mention when closing the menu with blur", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      insertOnBlur: true,
      creatable: true,
    });
    await utils.editor.type("@aaa");
    await utils.editor.blur();
    await expect(utils.menu).not.toBeVisible();
    await utils.hasText("[@aaa]");
  });

  test("should not insert the entered text as mention when closing the menu with blur", async ({
    page,
  }) => {
    const utils = await testUtils(page, { insertOnBlur: false });
    await utils.editor.type("@abc");
    await utils.editor.blur();
    await expect(utils.menu).not.toBeVisible();
    await utils.hasText("@abc");
    await utils.focusEnd();
    await utils.editor.type(" abc");
    await utils.hasText("@abc abc");
  });

  test("should not insert a mention when closing the menu with blur if there is only a trigger without text", async ({
    page,
  }) => {
    const utils = await testUtils(page);
    await utils.editor.type("@");
    await utils.editor.blur();
    await expect(utils.menu).not.toBeVisible();
    await utils.hasText("@");
  });

  test("should insert a new mention with a regex based trigger", async ({
    page,
  }) => {
    const utils = await testUtils(page, {
      creatable: true,
      autofocus: "start",
    });
    await utils.editor.type("aaa:b");
    await expect(utils.menu.getByText(`Add "b"`)).toBeVisible();
    await utils.menu.getByText(`Add "b"`).click();
    await utils.hasText("[aaa:b]");
  });
});
