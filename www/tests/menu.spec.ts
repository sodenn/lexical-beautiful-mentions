import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("Mention Menu", () => {
  test("should close the menu when the editor is blurred", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        initialValue: "@",
      },
    );
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should open the menu before a comma", async ({ page, browserName }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "start",
        initialValue: "Hey, are you there?",
      },
    );
    await utils.moveCursorForward(3);
    await utils.editorType(" @");
    await utils.hasText("Hey @, are you there?");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.mentionsMenu.getByText("Catherine").click();
    await utils.hasText("Hey [@Catherine], are you there?");
  });

  test("should keep menu open when navigating back using the arrow key", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "start",
        initialValue: "",
      },
    );
    await utils.editorType("@Cather");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await utils.hasText("[@Catherine]");
  });

  test("should filter suggestions after a new mention was added", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
        initialValue: "Hey @lisa",
      },
    );
    await utils.editorType(" @ant");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(2);
    await expect(utils.mentionsMenu.getByText("Anton")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add user "ant"`)).toBeVisible();
    await utils.hasText("Hey [@lisa] @ant");
  });

  test("should not show the option to add a new mention if it already exists", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils({ page, browserName }, { creatable: true });
    await utils.editorType("@Anton");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.mentionsMenu.getByText("Anton")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add "ant"`)).not.toBeVisible();
  });

  test("should not show the option to add a new mention if disabled", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils({ page, browserName }, { creatable: false });
    await utils.editorType("@abc");
    await expect(utils.mentionsMenu).toHaveCount(0);
  });

  test("should dynamically position the menu", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue:
          "Hey @Catherine, the task is #urgent and due:tomorrow at 2pm #meeting",
      },
    );
    await utils.editorType("@a");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(5);
    await expect(page).toHaveScreenshot({
      fullPage: true,
      animations: "disabled",
    });
  });

  test("should insert the entered text as mention when the editor is blurred", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        insertOnBlur: true,
        creatable: true,
      },
    );
    await utils.editorType("@abc");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@abc]");
  });

  test("should insert the selected mention when the editor is blurred (desktop)", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        insertOnBlur: true,
        creatable: true,
      },
    );
    await utils.editorType("@Gi");
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "Gina",
    );
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Gina]");
  });

  test("should insert the selected mention when the editor is blurred (mobile)", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    const utils = await testUtils(
      { page, browserName },
      {
        insertOnBlur: true,
        creatable: true,
      },
    );
    await utils.editorType("@Gi");
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Gi]");
  });

  test("should insert a selected mention by pressing enter", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils({ page, browserName });
    await utils.editorType("@b");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("Enter");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Boris]");
  });

  test("should insert a selected mention by pressing tab", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils({ page, browserName });
    await utils.editorType("@");
    await utils.editor.press("Tab");
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("[@Anton]");
  });

  test("should close the menu when pressing escape", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils({ page, browserName });
    await utils.editorType("@");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editor.press("Escape");
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should not insert the entered text as mention when the editor is blurred", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      { insertOnBlur: false },
    );
    await utils.editorType("@abc");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("@abc");
    await utils.focusEnd();
    await utils.editorType(" abc");
    await utils.hasText("@abc abc");
  });

  test("should not insert a mention when the editor is blurred if there is only a trigger without text", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils({ page, browserName });
    await utils.editorType("@");
    await utils.editor.blur();
    await expect(utils.mentionsMenu).not.toBeVisible();
    await utils.hasText("@");
  });

  test("should insert a new mention with a regex based trigger", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
        autofocus: "start",
      },
    );
    await utils.editorType("abc:b");
    await expect(utils.mentionsMenu.getByText(`Add "b"`)).toBeVisible();
    await utils.mentionsMenu.getByText(`Add "b"`).click();
    await utils.hasText("[abc:b]");
  });

  test("should display a loading indicator while fetching suggestions", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        asynchronous: true,
      },
    );
    await utils.editorType("@");
    await expect(page.getByText("Loading...")).toBeVisible();
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(5);
    await expect(page.getByText("Loading...")).not.toBeVisible();
  });

  test("should list existing mentions from the editor as suggestions", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
      },
    );
    await utils.editorType("abc:a");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await utils.mentionsMenu.getByText(`Add "a"`).click();
    await utils.hasText("[abc:a]");
    await utils.editorType("abc:");
    await expect(utils.mentionsMenu.getByRole("menuitem")).toHaveCount(1);
    await expect(utils.mentionsMenu.getByText("a")).toBeVisible();
    await utils.mentionsMenu.getByText("a").click();
    await utils.hasText("[abc:a] [abc:a]");
  });

  test("should display the mention menu after deleting a mention", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John",
        showMentionsOnDelete: true,
      },
    );
    await utils.editor.press("Backspace");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editorType("B");
    await utils.mentionsMenu.getByText("Boris").click();
    await utils.hasText("Hey [@Boris]");
  });

  test("should not display the mention menu after deleting a mention when the option is disabled", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John",
      },
    );
    await utils.editor.press("Backspace");
    await utils.sleep(200);
    await expect(utils.mentionsMenu).not.toBeVisible();
  });

  test("should display the mention menu after deleting a mention in the middle of a sentence", async ({
    page,
    browserName,
    isMobile,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "Hey @John how are you doing?",
        showMentionsOnDelete: true,
      },
    );
    await utils.moveCursorForward(6);
    await utils.editor.press("Backspace");
    await expect(utils.mentionsMenu).toBeVisible();
    await utils.editorType("B");
    isMobile
      ? await utils.mentionsMenu.getByText("Boris").click()
      : await utils.editor.press("Enter");
    await utils.hasText("Hey [@Boris] how are you doing?");
  });

  test("should call the onMenuOpen and onMenuClose callbacks", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
      },
    );
    await utils.editorType("@");
    let open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(true);
    await utils.editor.blur();
    open = await utils.isMenuOrComboboxOpen();
    expect(open).toBe(false);
  });

  test("should remove the typeahead element when cursor is not at a mention position", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
      },
    );
    await utils.editorType("@");
    await utils.editorType("xyz");
    await expect(page.locator("#typeahead-menu")).toHaveCount(1);
    await utils.moveCaretToStart();
    await expect(page.locator("#typeahead-menu")).toHaveCount(0);
  });

  test("should display a no results message when there are no suggestions", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        autofocus: "end",
        emptyComponent: true,
      },
    );
    await expect(page.getByText("No results found")).not.toBeVisible();
    await utils.editorType("@unknown");
    await expect(page.getByText("No results found")).toBeVisible();
  });
});
