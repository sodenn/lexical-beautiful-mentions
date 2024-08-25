import { expect, test } from "@playwright/test";
import * as os from "os";
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

  test("should insert a new mention that contains spaces", async ({
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

  test("should insert a new mention when pressing a non-word character", async ({
    page,
    browserName,
  }) => {
    const utils = await testUtils(
      { page, browserName },
      {
        creatable: true,
        mentionEnclosure: true,
      },
    );
    await utils.editorType("Hello @John, how are you?");
    await utils.hasText(`Hello [@John], how are you?`);
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
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "@Catherine",
        customMentionNode: true,
      },
    );
    const mentionPosition = await page
      .locator(`[data-beautiful-mention="@Catherine"]`)
      .boundingBox();
    await expect(
      page.locator(`[data-beautiful-mention="@Catherine"]`),
    ).toHaveAttribute("data-state", "closed");
    await page.mouse.move(mentionPosition.x + 1, mentionPosition.y + 1);
    await expect(
      page.locator(`[data-beautiful-mention="@Catherine"]`),
    ).toHaveAttribute("data-state", "delayed-open");
    await page.getByText("Remove Mention").click();
    await utils.countMentions(0);
  });

  test("should insert a mention in brackets", async ({ page, browserName }) => {
    const utils = await testUtils({ page, browserName });
    await utils.editorType("(@Cath");
    await utils.mentionsMenu.getByText("Catherine").click();
    await utils.editorType(")");
    await utils.hasText(`([@Catherine])`);
  });

  // only works when running in headful mode
  // - https://github.com/kenthu/human-interest-verifier/issues/1
  // - https://github.com/microsoft/playwright/issues/11654
  test.skip("should copy mention to clipboard and paste it back in the editor", async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(!!isMobile, "desktop only");
    const utils = await testUtils(
      { page, browserName },
      {
        initialValue: "@Catherine",
        customMentionNode: true,
      },
    );
    await page.click(`[data-beautiful-mention="@Catherine"]`);
    const isMac = os.platform() === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyC`);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press(`${modifier}+KeyV`);
    await utils.hasText("[@Catherine] [@Catherine]");
  });
});
