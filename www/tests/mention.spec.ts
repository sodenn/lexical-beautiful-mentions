import { expect, test } from "@playwright/test";
import { testUtils } from "./test-utils";

test.describe("mentions handling", () => {
  test("should render a new mention with dashes", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "due:2023-06-06",
      },
    );
    await utils.sleep(200);
    await utils.hasText("[due:2023-06-06]");
  });

  test("should insert a new mention with spaces", async ({
    page,
    browserName,
    isMobile,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        allowSpaces: true,
        creatable: true,
        mentionEnclosure: true,
      },
    );
    await utils.editorType("@John Doe");
    isMobile
      ? await utils.mentionsMenu.getByText("John Doe").click()
      : await utils.editor.press("Tab");
    await utils.hasText(`[@"John Doe"]`);
  });

  test("should insert a selected mention by pressing space", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
        mentionEnclosure: true,
      },
    );
    await utils.editorType("@C");
    await expect(utils.mentionsMenu.getByText("Catherine")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add user "C"`)).toBeVisible();
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "Catherine",
    );
    await utils.editor.press("Space");
    await utils.hasText(`[@Catherine] `);
  });

  test("should insert a new mention by pressing space", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!isMobile, "mobile only");
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
        mentionEnclosure: true,
      },
    );
    await utils.editorType("@C");
    await expect(utils.mentionsMenu.getByText("Catherine")).toBeVisible();
    await expect(utils.mentionsMenu.getByText(`Add user "C"`)).toBeVisible();
    await expect(utils.mentionsMenu).toHaveAttribute(
      "aria-activedescendant",
      "",
    );
    await utils.editor.press("Space");
    await utils.hasText(`[@C] `);
  });

  test("should remove a mention via undo command (Ctrl/Cmd + Z)", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils({ page, browserName });
    const undoCommand = process.platform === "darwin" ? "Meta+Z" : "Control+Z";
    await utils.editorType("@Catherine");
    await utils.editor.press("Enter");
    await utils.hasText("[@Catherine]");
    await utils.editor.press(undoCommand);
    await utils.hasText("@Catherine");
    await utils.editor.press(undoCommand);
    await utils.hasText("@C");
    await utils.editor.press(undoCommand);
    await utils.hasText("@");
    await utils.editor.press(undoCommand);
    await utils.hasText("");
  });

  test("should use custom mention nodes", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    await testUtils(
      { page, browserName },
      {
        initialValue: "@Catherine",
        customMentionNode: true,
      },
    );
    const mentionPosition = await page
      .locator(`[data-beautiful-mention="@Catherine"]`)
      .boundingBox();
    await expect(page.getByRole("tooltip")).not.toBeVisible();
    await page.mouse.move(mentionPosition.x, mentionPosition.y);
    await expect(page.getByRole("tooltip")).toBeVisible();
  });
});
